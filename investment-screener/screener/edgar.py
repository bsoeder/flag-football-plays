"""Live SEC EDGAR Form D loader.

SEC publishes the structured Form D data as quarterly ZIP archives of
tab-separated files, going back to 2008:

    https://www.sec.gov/files/dera/data/form-d-data-sets/{YYYY}q{Q}_d.zip

Each archive contains (at minimum):
    FORMDSUBMISSION.tsv  -- one row per filing: accession no, filing date, type
    ISSUERS.tsv          -- issuer identity: CIK, name, entity type, incorporation
    OFFERING.tsv         -- the economics: amounts, investors, industry, min ticket

This module downloads those archives and returns three normalised pandas
DataFrames with exactly the columns the rest of the pipeline consumes, so
`screener.features` / `screener.labels` never need to know whether the data is
live or simulated.

NOTE: SEC requires a descriptive User-Agent with contact info and asks callers
to stay under ~10 requests/second. This module honours both.

In sandboxed environments where outbound egress to sec.gov is blocked, calling
`load_form_d` raises EgressBlocked; callers fall back to `screener.simulate`.
"""

from __future__ import annotations

import io
import time
import zipfile
from dataclasses import dataclass

import pandas as pd

SEC_FORM_D_URL = "https://www.sec.gov/files/dera/data/form-d-data-sets/{year}q{q}_d.zip"
USER_AGENT = "investment-screener research contact@example.com"

# Columns we rely on downstream. The real files carry many more; we keep a
# stable, documented subset so the schema contract is explicit.
SUBMISSION_COLS = ["ACCESSIONNUMBER", "FILING_DATE", "SUBMISSIONTYPE"]
ISSUER_COLS = [
    "ACCESSIONNUMBER", "IS_PRIMARYISSUER_FLAG", "CIK", "ENTITYNAME",
    "STATEORCOUNTRY", "ENTITYTYPE", "YEAROFINC_VALUE_ENTERED",
    "YEAROFINC_TIMESPAN_CHOICE",
]
OFFERING_COLS = [
    "ACCESSIONNUMBER", "INDUSTRYGROUPTYPE", "INVESTMENTFUNDTYPE",
    "REVENUERANGE", "MINIMUMINVESTMENTACCEPTED", "TOTALOFFERINGAMOUNT",
    "TOTALAMOUNTSOLD", "TOTALREMAINING", "HASNONACCREDITEDINVESTORS",
    "TOTALNUMBERALREADYINVESTED",
]


class EgressBlocked(RuntimeError):
    """Raised when sec.gov cannot be reached (e.g. sandbox egress policy)."""


@dataclass
class FormDTables:
    submissions: pd.DataFrame
    issuers: pd.DataFrame
    offerings: pd.DataFrame


def _quarters(start_year: int, end_year: int):
    for y in range(start_year, end_year + 1):
        for q in (1, 2, 3, 4):
            yield y, q


def _download_quarter(year: int, q: int, session) -> FormDTables:
    url = SEC_FORM_D_URL.format(year=year, q=q)
    try:
        resp = session.get(url, timeout=60)
    except Exception as exc:  # network layer refused / proxy denied
        raise EgressBlocked(f"could not reach {url}: {exc}") from exc
    if resp.status_code in (403, 407):
        raise EgressBlocked(f"egress policy denied {url} (HTTP {resp.status_code})")
    resp.raise_for_status()

    zf = zipfile.ZipFile(io.BytesIO(resp.content))

    def read(name: str, cols: list[str]) -> pd.DataFrame:
        with zf.open(name) as fh:
            df = pd.read_csv(fh, sep="\t", dtype=str, on_bad_lines="skip")
        # keep only columns we know; tolerate schema drift
        keep = [c for c in cols if c in df.columns]
        return df[keep].copy()

    return FormDTables(
        submissions=read("FORMDSUBMISSION.tsv", SUBMISSION_COLS),
        issuers=read("ISSUERS.tsv", ISSUER_COLS),
        offerings=read("OFFERING.tsv", OFFERING_COLS),
    )


def load_form_d(start_year: int, end_year: int) -> FormDTables:
    """Download and concatenate Form D data sets for [start_year, end_year].

    Raises EgressBlocked if sec.gov is unreachable so callers can fall back to
    the offline simulator.
    """
    import requests

    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})

    subs, iss, off = [], [], []
    for year, q in _quarters(start_year, end_year):
        tables = _download_quarter(year, q, session)
        subs.append(tables.submissions)
        iss.append(tables.issuers)
        off.append(tables.offerings)
        time.sleep(0.2)  # be polite to SEC

    return FormDTables(
        submissions=pd.concat(subs, ignore_index=True),
        issuers=pd.concat(iss, ignore_index=True),
        offerings=pd.concat(off, ignore_index=True),
    )
