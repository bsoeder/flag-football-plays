"""Build the modelling frame: one row per issuer's FIRST Form D, plus the
follow-on outcome label reconstructed from later filings by the same CIK.

The label answers a concrete, investor-relevant question:

    Given a company's first Form D (a seed / early raise), did the SAME issuer
    (same CIK) go on to file a *larger* Form D within `window_years`?

A larger follow-on raise is a cheap, fully-free proxy for "this company kept
raising and grew" -- exactly the survivorship/traction signal an angel wants to
be on the right side of. It is imperfect (a company can succeed without another
Form D, or file a bridge that is smaller), but it is observable for the entire
universe with no paid data and no entity-resolution guesswork, because the CIK
is a stable issuer key.

To avoid look-ahead bias, an issuer is only included if its full outcome window
is observable within the data (`first_date + window <= data_end`).
"""

from __future__ import annotations

import pandas as pd

from .edgar import FormDTables


def _primary_issuer_map(iss: pd.DataFrame) -> pd.DataFrame:
    """One issuer row per accession (the primary issuer of the filing)."""
    df = iss.copy()
    if "IS_PRIMARYISSUER_FLAG" in df.columns:
        prim = df[df["IS_PRIMARYISSUER_FLAG"].str.lower() == "true"]
        # some filings never flag a primary; fall back to first issuer row
        df = prim if len(prim) else df
    return df.drop_duplicates("ACCESSIONNUMBER", keep="first")


def build_frame(tables: FormDTables, window_years: int = 3) -> pd.DataFrame:
    """Return one row per issuer's first filing with a `followon` label."""
    sub = tables.submissions.copy()
    iss = _primary_issuer_map(tables.issuers)
    off = tables.offerings.drop_duplicates("ACCESSIONNUMBER", keep="first")

    sub["FILING_DATE"] = pd.to_datetime(sub["FILING_DATE"], errors="coerce")
    data_end = sub["FILING_DATE"].max()

    # attach CIK to every submission via the issuer table
    filings = sub.merge(iss[["ACCESSIONNUMBER", "CIK"]], on="ACCESSIONNUMBER", how="inner")
    filings = filings.dropna(subset=["CIK", "FILING_DATE"])

    # numeric offering amount, for the "larger" comparison
    off["_amt"] = pd.to_numeric(off.get("TOTALOFFERINGAMOUNT"), errors="coerce")
    filings = filings.merge(off[["ACCESSIONNUMBER", "_amt"]], on="ACCESSIONNUMBER", how="left")

    filings = filings.sort_values(["CIK", "FILING_DATE"])

    # first filing per issuer
    first = filings.groupby("CIK", as_index=False).first()
    first = first.rename(columns={
        "ACCESSIONNUMBER": "first_accession",
        "FILING_DATE": "first_date",
        "_amt": "first_amount",
    })

    # for each issuer, find any later filing that is larger than the first
    later = filings.merge(
        first[["CIK", "first_date", "first_amount"]], on="CIK", how="left"
    )
    later = later[later["FILING_DATE"] > later["first_date"]]
    later["_within"] = (
        later["FILING_DATE"] <= later["first_date"] + pd.DateOffset(years=window_years)
    )
    later["_larger"] = later["_amt"] > later["first_amount"]
    graduated = (
        later[later["_within"] & later["_larger"]]
        .groupby("CIK")["FILING_DATE"].min()
        .rename("followon_date")
        .reset_index()
    )

    frame = first.merge(graduated, on="CIK", how="left")
    frame["followon"] = frame["followon_date"].notna().astype(int)

    # observability filter: only keep cohorts whose full window has elapsed
    observable = frame["first_date"] + pd.DateOffset(years=window_years) <= data_end
    frame = frame[observable].copy()

    frame["cohort_year"] = frame["first_date"].dt.year
    return frame.reset_index(drop=True)
