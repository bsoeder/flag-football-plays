"""Feature engineering from a company's FIRST Form D filing only.

Every feature is knowable at the moment of the first filing, so there is no
leakage from the future follow-on outcome. Features are grouped by the investor
question they proxy:

  Traction / demand:   fill_rate, amount_sold, investor_count, amount_per_investor
  Ambition / stage:    offering_amount, min_ticket, revenue_stage_ord
  Company profile:     industry (one-hot), is_operating_co, entity_type, incorporation age
  Openness:            has_nonaccredited

The function takes the frame from `screener.labels.build_frame` joined back to
the offering / issuer detail and returns a numeric feature matrix + the label.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from .edgar import FormDTables
from .labels import _primary_issuer_map

REVENUE_ORDER = {
    "No Revenues": 0, "Not Applicable": 0, "Decline to Disclose": 0,
    "$1 - $1,000,000": 1, "$1,000,000 - $5,000,000": 2,
    "$5,000,000 - $25,000,000": 3, "$25,000,000 - $100,000,000": 4,
    "Over $100,000,000": 5,
}
INC_ORDER = {"Yet to Begin Operations": 0, "Within Last Five Years": 1, "Over Five Years": 2}

# industries kept as explicit dummies; everything else folds into "other"
INDUSTRY_KEEP = ["Technology", "Health Care", "Financial Services", "Real Estate", "Commercial"]


def build_features(frame: pd.DataFrame, tables: FormDTables) -> pd.DataFrame:
    """Join first-filing detail onto the labelled frame and derive features."""
    off = tables.offerings.drop_duplicates("ACCESSIONNUMBER", keep="first")
    iss = _primary_issuer_map(tables.issuers)

    df = frame.merge(off, left_on="first_accession", right_on="ACCESSIONNUMBER", how="left")
    df = df.merge(
        iss[["ACCESSIONNUMBER", "ENTITYTYPE", "YEAROFINC_TIMESPAN_CHOICE", "STATEORCOUNTRY"]],
        left_on="first_accession", right_on="ACCESSIONNUMBER", how="left",
        suffixes=("", "_iss"),
    )

    num = lambda c: pd.to_numeric(df.get(c), errors="coerce")
    offering = num("TOTALOFFERINGAMOUNT")
    sold = num("TOTALAMOUNTSOLD")
    investors = num("TOTALNUMBERALREADYINVESTED").clip(lower=1)
    min_ticket = num("MINIMUMINVESTMENTACCEPTED")

    out = pd.DataFrame(index=df.index)
    # traction / demand
    out["fill_rate"] = (sold / offering).clip(0, 1).fillna(0)
    out["log_amount_sold"] = np.log1p(sold.fillna(0))
    out["log_investor_count"] = np.log1p(investors.fillna(1))
    out["log_amount_per_investor"] = np.log1p((sold / investors).fillna(0))
    # ambition / stage
    out["log_offering_amount"] = np.log1p(offering.fillna(0))
    out["log_min_ticket"] = np.log1p(min_ticket.fillna(0))
    out["revenue_stage"] = df.get("REVENUERANGE").map(REVENUE_ORDER).fillna(0)
    out["has_revenue"] = (out["revenue_stage"] > 0).astype(int)
    # profile
    industry = df.get("INDUSTRYGROUPTYPE").fillna("Other")
    out["is_pooled_fund"] = (industry == "Pooled Investment Fund").astype(int)
    for ind in INDUSTRY_KEEP:
        out[f"ind_{ind.lower().replace(' ', '_')}"] = (industry == ind).astype(int)
    out["inc_age_ord"] = df.get("YEAROFINC_TIMESPAN_CHOICE").map(INC_ORDER).fillna(1)
    out["is_corporation"] = (df.get("ENTITYTYPE") == "Corporation").astype(int)
    out["has_nonaccredited"] = (
        df.get("HASNONACCREDITEDINVESTORS").astype(str).str.lower() == "true"
    ).astype(int)

    # carry through label + cohort for the time split
    out["followon"] = df["followon"].values
    out["cohort_year"] = df["cohort_year"].values
    out["is_operating_co"] = 1 - out["is_pooled_fund"]
    return out


FEATURE_COLS = [
    "fill_rate", "log_amount_sold", "log_investor_count", "log_amount_per_investor",
    "log_offering_amount", "log_min_ticket", "revenue_stage", "has_revenue",
    "is_pooled_fund", "ind_technology", "ind_health_care", "ind_financial_services",
    "ind_real_estate", "ind_commercial", "inc_age_ord", "is_corporation",
    "has_nonaccredited",
]
