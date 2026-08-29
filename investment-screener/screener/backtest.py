"""Backtest: do first-filing signals predict a larger follow-on raise?

Uses a strict *time-based* split -- train on earlier cohorts, test on later
ones -- because a real screener only ever has the past to learn from. Reports:

  * base rate and cohort sizes
  * univariate signal: AUC and top-vs-bottom-decile lift for each feature
  * two models (L2 logistic regression, gradient boosting)
  * discrimination (ROC-AUC), ranking quality (PR-AUC / average precision),
    calibration (Brier score), and decile lift on the held-out cohorts
  * precision@k -- if an investor only looked at the top-scored N%, how much
    better than random is their hit rate (the metric that actually matters for
    a shortlisting tool)
"""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score, brier_score_loss, roc_auc_score,
)
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from .features import FEATURE_COLS


@dataclass
class ModelResult:
    name: str
    auc: float
    avg_precision: float
    brier: float
    lift_top_decile: float
    precision_at_10pct: float
    base_rate: float
    feature_importance: dict = field(default_factory=dict)


def _decile_lift(y_true: np.ndarray, score: np.ndarray, frac: float = 0.1) -> float:
    """Hit-rate in the top `frac` by score, divided by the overall base rate."""
    n = len(score)
    k = max(1, int(n * frac))
    order = np.argsort(-score)
    top = y_true[order[:k]]
    base = y_true.mean()
    return float(top.mean() / base) if base > 0 else float("nan")


def univariate_signal(train: pd.DataFrame) -> pd.DataFrame:
    """AUC + top/bottom-decile follow-on rate for each feature, on train."""
    y = train["followon"].to_numpy()
    rows = []
    for f in FEATURE_COLS:
        x = train[f].to_numpy(dtype=float)
        if np.unique(x).size < 2:
            continue
        # orient so higher x -> higher score
        auc = roc_auc_score(y, x)
        direction = 1.0 if auc >= 0.5 else -1.0
        auc = max(auc, 1 - auc)
        s = x * direction
        top = _decile_lift(y, s, 0.1)
        rows.append({"feature": f, "auc": round(auc, 3), "top_decile_lift": round(top, 2)})
    return pd.DataFrame(rows).sort_values("auc", ascending=False).reset_index(drop=True)


def _fit_eval(model, name, Xtr, ytr, Xte, yte, importance=None) -> ModelResult:
    model.fit(Xtr, ytr)
    p = model.predict_proba(Xte)[:, 1]
    return ModelResult(
        name=name,
        auc=round(roc_auc_score(yte, p), 4),
        avg_precision=round(average_precision_score(yte, p), 4),
        brier=round(brier_score_loss(yte, p), 4),
        lift_top_decile=round(_decile_lift(yte, p, 0.1), 2),
        precision_at_10pct=round(yte[np.argsort(-p)[: max(1, int(len(p) * 0.1))]].mean(), 4),
        base_rate=round(yte.mean(), 4),
        feature_importance=importance(model) if importance else {},
    )


def run_backtest(feat: pd.DataFrame, split_year: int, operating_only: bool = True):
    """Train on cohorts < split_year, test on cohorts >= split_year."""
    df = feat.copy()
    if operating_only:
        df = df[df["is_operating_co"] == 1].copy()

    train = df[df["cohort_year"] < split_year]
    test = df[df["cohort_year"] >= split_year]

    Xtr, ytr = train[FEATURE_COLS].to_numpy(float), train["followon"].to_numpy()
    Xte, yte = test[FEATURE_COLS].to_numpy(float), test["followon"].to_numpy()

    logit = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000, C=1.0))
    gb = HistGradientBoostingClassifier(max_depth=3, learning_rate=0.06,
                                        max_iter=300, l2_regularization=1.0,
                                        random_state=0)

    def logit_imp(m):
        coefs = m.named_steps["logisticregression"].coef_[0]
        return {f: round(float(c), 3) for f, c in sorted(
            zip(FEATURE_COLS, coefs), key=lambda t: -abs(t[1]))}

    results = [
        _fit_eval(logit, "logistic_regression", Xtr, ytr, Xte, yte, logit_imp),
        _fit_eval(gb, "gradient_boosting", Xtr, ytr, Xte, yte),
    ]

    meta = {
        "n_train": int(len(train)), "n_test": int(len(test)),
        "train_cohorts": sorted(train["cohort_year"].unique().tolist()),
        "test_cohorts": sorted(test["cohort_year"].unique().tolist()),
        "base_rate_train": round(float(ytr.mean()), 4),
        "base_rate_test": round(float(yte.mean()), 4),
        "univariate": univariate_signal(train),
    }
    return results, meta, (test, gb)


def top_shortlist(test: pd.DataFrame, model, n: int = 15) -> pd.DataFrame:
    """The screener's actual output: the highest-scored companies to look at."""
    p = model.predict_proba(test[FEATURE_COLS].to_numpy(float))[:, 1]
    out = test.copy()
    out["score"] = p
    cols = ["score", "followon", "log_offering_amount", "fill_rate",
            "log_investor_count", "revenue_stage"]
    return out.sort_values("score", ascending=False).head(n)[cols].reset_index(drop=True)
