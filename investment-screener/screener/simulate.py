"""Calibrated offline simulator for SEC Form D data.

Purpose: let the *entire* pipeline (features -> labels -> backtest) run and be
validated in environments without egress to sec.gov, using data whose schema,
column names and value vocabularies match the real Form D structured Data Sets.

Design principles that keep the backtest honest (not circular):

1. Each issuer has a hidden latent `quality ~ N(0, 1)`.
2. Observed FEATURES (amount raised, fill rate, investor count, revenue stage,
   industry, ...) are *noisy* functions of quality.
3. The follow-on OUTCOME is a *separate* noisy logistic function of quality,
   NOT of the observed features. A model therefore has to recover quality
   through the features, which caps achievable AUC at a realistic ~0.65-0.72.
4. Labels are never written into the tables. Follow-on raises are emitted as
   real additional filing rows for the same CIK, exactly as they'd appear in
   live data, and `screener.labels` reconstructs the label from the tables.

The distributions below are calibrated to publicly documented Form D
characteristics (industry mix dominated by pooled funds and real estate;
heavy-tailed offering sizes; most operating-company seed rounds partially
filled; low venture "graduation" rates). They are approximations for a
methodology demo, not a claim about any real company.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from .edgar import FormDTables

# --- value vocabularies straight from the real Form D schema ----------------

INDUSTRY_GROUPS = [
    "Pooled Investment Fund", "Real Estate", "Technology", "Health Care",
    "Financial Services", "Commercial", "Energy", "Manufacturing",
    "Retailing", "Other",
]
INDUSTRY_WEIGHTS = np.array([0.35, 0.15, 0.12, 0.08, 0.07, 0.05, 0.04, 0.04, 0.03, 0.07])

REVENUE_RANGES = [
    "No Revenues", "$1 - $1,000,000", "$1,000,000 - $5,000,000",
    "$5,000,000 - $25,000,000", "$25,000,000 - $100,000,000",
    "Over $100,000,000", "Decline to Disclose", "Not Applicable",
]

ENTITY_TYPES = [
    "Corporation", "Limited Liability Company", "Limited Partnership",
    "Business Trust", "Other",
]

INC_TIMESPANS = ["Yet to Begin Operations", "Within Last Five Years", "Over Five Years"]

STATES = ["CA", "NY", "MA", "TX", "WA", "CO", "IL", "FL", "GA", "PA", "DE", "Other"]
STATE_WEIGHTS = np.array([0.24, 0.14, 0.07, 0.08, 0.06, 0.04, 0.04, 0.05, 0.03, 0.03, 0.02, 0.20])

# Industries where a "venture graduation" (larger follow-on) is more plausible.
VENTURE_TILT = {
    "Technology": 0.9, "Health Care": 0.7, "Financial Services": 0.2,
    "Commercial": 0.1, "Energy": 0.0, "Manufacturing": 0.0, "Retailing": 0.0,
    "Real Estate": -0.6, "Pooled Investment Fund": -0.4, "Other": -0.2,
}


def _accession(n: int) -> str:
    # mimic the 0000000000-00-000000 accession format
    return f"{n:010d}-{(n % 24) + 1:02d}-{(n % 899999) + 100000:06d}"


def _sigmoid(x: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-x))


def simulate_form_d(
    n_issuers: int = 40_000,
    start_year: int = 2014,
    end_year: int = 2021,
    outcome_window_years: int = 3,
    seed: int = 7,
) -> FormDTables:
    """Generate Form D tables for `n_issuers` first-time filers.

    First filings are dated uniformly in [start_year, end_year]. Follow-on
    filings (when they occur) may land up to `outcome_window_years` later, i.e.
    as late as end_year + window, so every cohort in the window is fully
    observable. Returns the same FormDTables container as the live loader.
    """
    rng = np.random.default_rng(seed)
    n = n_issuers

    quality = rng.normal(0, 1, n)                      # hidden latent
    industry = rng.choice(INDUSTRY_GROUPS, size=n, p=INDUSTRY_WEIGHTS)
    is_fund = industry == "Pooled Investment Fund"

    # --- first-filing date -------------------------------------------------
    span_days = (end_year - start_year + 1) * 365
    day0 = pd.Timestamp(f"{start_year}-01-01")
    first_offset = rng.integers(0, span_days, size=n)
    first_date = day0 + pd.to_timedelta(first_offset, unit="D")

    # --- offering economics (noisy functions of quality) -------------------
    # Offering amount: heavy-tailed lognormal, shifted up by quality.
    log_amt = 13.0 + 0.7 * quality + rng.normal(0, 1.1, n)   # ~ e^13 = $440k median
    total_offering = np.exp(log_amt).round(-3)

    # Fill rate (amount sold / offering): higher quality fills more, plus noise.
    fill_logit = 0.2 + 1.1 * quality + rng.normal(0, 1.3, n)
    fill_rate = np.clip(_sigmoid(fill_logit), 0.0, 1.0)
    total_sold = (total_offering * fill_rate).round(-3)
    total_remaining = (total_offering - total_sold).clip(min=0)

    # Investor count: Poisson-ish, mean rises with quality and fill.
    inv_mean = np.exp(1.2 + 0.5 * quality + 0.8 * fill_rate)
    n_investors = rng.poisson(np.clip(inv_mean, 0.2, 300)).clip(min=1)

    # Minimum investment ticket (dollars), lognormal.
    min_invest = np.exp(9.5 + rng.normal(0, 1.0, n)).round(-2)

    # Revenue stage: higher-quality operating cos more likely to show revenue.
    rev_score = 0.6 * quality + rng.normal(0, 1.0, n)
    revenue = np.where(
        rev_score < -0.7, "No Revenues",
        np.where(rev_score < 0.2, "$1 - $1,000,000",
        np.where(rev_score < 0.9, "$1,000,000 - $5,000,000",
        np.where(rev_score < 1.6, "$5,000,000 - $25,000,000", "$25,000,000 - $100,000,000"))),
    )
    revenue = np.where(is_fund, "Not Applicable", revenue)

    has_nonaccredited = np.where(rng.random(n) < 0.12, "true", "false")

    entity_type = np.where(
        is_fund,
        rng.choice(["Limited Partnership", "Limited Liability Company"], size=n),
        rng.choice(ENTITY_TYPES, size=n, p=[0.55, 0.30, 0.05, 0.03, 0.07]),
    )
    inc_timespan = np.where(
        is_fund, "Within Last Five Years",
        rng.choice(INC_TIMESPANS, size=n, p=[0.20, 0.55, 0.25]),
    )
    year_of_inc = (first_date.year - rng.integers(0, 8, size=n)).astype(str)
    state = rng.choice(STATES, size=n, p=STATE_WEIGHTS)

    # --- OUTCOME: follow-on raise (separate noisy logistic in quality) -----
    # Operating companies only have a meaningful "graduation" concept; funds
    # re-file for new vehicles (noise for the startup question) and get a
    # separate, weakly-signalled process.
    tilt = np.array([VENTURE_TILT[i] for i in industry])
    followon_logit = (
        -1.9                       # base rate ~ 13%
        + 1.3 * quality            # the real signal (independent noise below)
        + 0.6 * tilt
        + rng.normal(0, 1.4, n)    # irreducible noise -> realistic AUC ceiling
    )
    followon_logit = np.where(is_fund, followon_logit - 0.5, followon_logit)
    p_followon = _sigmoid(followon_logit)
    has_followon = rng.random(n) < p_followon

    # follow-on timing + size
    delay_days = rng.integers(120, outcome_window_years * 365, size=n)
    followon_date = first_date + pd.to_timedelta(delay_days, unit="D")
    followon_amount = (total_offering * np.exp(0.9 + 0.4 * rng.normal(0, 1, n))).round(-3)

    # --- assemble the three tables -----------------------------------------
    acc_first = np.array([_accession(i) for i in range(n)])
    acc_follow = np.array([_accession(n + i) for i in range(n)])

    cik = (1_000_000 + np.arange(n)).astype(str)

    sub = pd.DataFrame({
        "ACCESSIONNUMBER": acc_first,
        "FILING_DATE": first_date.strftime("%Y-%m-%d"),
        "SUBMISSIONTYPE": "D",
    })
    iss = pd.DataFrame({
        "ACCESSIONNUMBER": acc_first,
        "IS_PRIMARYISSUER_FLAG": "true",
        "CIK": cik,
        "ENTITYNAME": [f"Issuer {i}" for i in range(n)],
        "STATEORCOUNTRY": state,
        "ENTITYTYPE": entity_type,
        "YEAROFINC_VALUE_ENTERED": year_of_inc,
        "YEAROFINC_TIMESPAN_CHOICE": inc_timespan,
    })
    off = pd.DataFrame({
        "ACCESSIONNUMBER": acc_first,
        "INDUSTRYGROUPTYPE": industry,
        "INVESTMENTFUNDTYPE": np.where(is_fund, "Hedge Fund", ""),
        "REVENUERANGE": revenue,
        "MINIMUMINVESTMENTACCEPTED": min_invest.astype("int64"),
        "TOTALOFFERINGAMOUNT": total_offering.astype("int64"),
        "TOTALAMOUNTSOLD": total_sold.astype("int64"),
        "TOTALREMAINING": total_remaining.astype("int64"),
        "HASNONACCREDITEDINVESTORS": has_nonaccredited,
        "TOTALNUMBERALREADYINVESTED": n_investors.astype("int64"),
    })

    # follow-on rows for issuers that graduated
    fmask = has_followon
    sub_f = pd.DataFrame({
        "ACCESSIONNUMBER": acc_follow[fmask],
        "FILING_DATE": followon_date[fmask].strftime("%Y-%m-%d"),
        "SUBMISSIONTYPE": "D",
    })
    iss_f = pd.DataFrame({
        "ACCESSIONNUMBER": acc_follow[fmask],
        "IS_PRIMARYISSUER_FLAG": "true",
        "CIK": cik[fmask],
        "ENTITYNAME": [f"Issuer {i}" for i in np.where(fmask)[0]],
        "STATEORCOUNTRY": state[fmask],
        "ENTITYTYPE": entity_type[fmask],
        "YEAROFINC_VALUE_ENTERED": year_of_inc[fmask],
        "YEAROFINC_TIMESPAN_CHOICE": inc_timespan[fmask],
    })
    off_f = pd.DataFrame({
        "ACCESSIONNUMBER": acc_follow[fmask],
        "INDUSTRYGROUPTYPE": industry[fmask],
        "INVESTMENTFUNDTYPE": np.where(is_fund[fmask], "Hedge Fund", ""),
        "REVENUERANGE": revenue[fmask],
        "MINIMUMINVESTMENTACCEPTED": min_invest[fmask].astype("int64"),
        "TOTALOFFERINGAMOUNT": followon_amount[fmask].astype("int64"),
        "TOTALAMOUNTSOLD": (followon_amount[fmask] * 0.5).astype("int64"),
        "TOTALREMAINING": (followon_amount[fmask] * 0.5).astype("int64"),
        "HASNONACCREDITEDINVESTORS": has_nonaccredited[fmask],
        "TOTALNUMBERALREADYINVESTED": (n_investors[fmask] + 5).astype("int64"),
    })

    return FormDTables(
        submissions=pd.concat([sub, sub_f], ignore_index=True),
        issuers=pd.concat([iss, iss_f], ignore_index=True),
        offerings=pd.concat([off, off_f], ignore_index=True),
    )
