"""Evaluate the current rule-based classifier on the supplied TREC test file.

Outputs real metrics and a confusion matrix; no scores are hard-coded.
Usage: python scripts/evaluate_rules.py --test data/raw/trec-test-par.parquet
"""
from __future__ import annotations
import argparse
import json
from collections import Counter
from pathlib import Path
import sys

import matplotlib.pyplot as plt
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, ConfusionMatrixDisplay

from rule_classifier import CLASSES, predict

QUESTION_WORDS = ("who", "what", "where", "when", "which", "why", "how")


def get_main_confusion(y_true, y_pred):
    errors = Counter((truth, pred) for truth, pred in zip(y_true, y_pred) if truth != pred)
    if not errors:
        return "No errors"
    (truth, pred), n = errors.most_common(1)[0]
    return f"{truth} → {pred} ({n})"


def subgroup_rows(df: pd.DataFrame) -> list[dict]:
    text = df["text"].fillna("").astype(str)
    starts_with_qword = text.str.strip().str.lower().str.startswith(QUESTION_WORDS)
    word_counts = text.str.split().str.len()
    masks = [
        ("A. Question-word first", starts_with_qword),
        ("B. No question word first", ~starts_with_qword),
        ("C. Short (six words or fewer)", word_counts <= 6),
        ("D. Long (more than six words)", word_counts > 6),
    ]
    rows = []
    for name, mask in masks:
        group = df.loc[mask]
        if group.empty:
            rows.append({"subgroup": name, "n": 0, "correct": 0, "accuracy": None, "main_confusion": "No records"})
            continue
        truth = group["coarse_label"].astype(str).str.upper().tolist()
        pred = group["prediction"].tolist()
        rows.append({
            "subgroup": name,
            "n": len(group),
            "correct": sum(t == p for t, p in zip(truth, pred)),
            "accuracy": accuracy_score(truth, pred),
            "main_confusion": get_main_confusion(truth, pred),
        })
    return rows


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--test", default="data/raw/trec-test-par.parquet", help="Path to TREC test Parquet file")
    parser.add_argument("--out-dir", default="outputs/generated", help="Directory for reports and charts")
    args = parser.parse_args()
    test_path = Path(args.test)
    if not test_path.exists():
        print(f"Test file not found: {test_path}. Place the supplied Parquet file at that path or pass --test.", file=sys.stderr)
        return 2
    df = pd.read_parquet(test_path)
    required = {"text", "coarse_label"}
    missing = required - set(df.columns)
    if missing:
        print(f"Missing required dataset columns: {', '.join(sorted(missing))}", file=sys.stderr)
        return 2
    df = df.dropna(subset=["text", "coarse_label"]).copy()
    df["text"] = df["text"].astype(str)
    df["coarse_label"] = df["coarse_label"].astype(str).str.upper()
    unknown = sorted(set(df["coarse_label"]) - set(CLASSES))
    if unknown:
        print(f"Unexpected coarse labels: {unknown}", file=sys.stderr)
        return 2
    df["prediction"] = df["text"].map(predict)
    y_true, y_pred = df["coarse_label"].tolist(), df["prediction"].tolist()
    accuracy = accuracy_score(y_true, y_pred)
    report = classification_report(y_true, y_pred, labels=CLASSES, output_dict=True, zero_division=0)
    cm = confusion_matrix(y_true, y_pred, labels=CLASSES)
    out = Path(args.out_dir)
    out.mkdir(parents=True, exist_ok=True)
    report_rows = []
    for code in CLASSES:
        metrics = report.get(code, {})
        report_rows.append({
            "class": code,
            "precision": metrics.get("precision", 0.0),
            "recall": metrics.get("recall", 0.0),
            "f1": metrics.get("f1-score", 0.0),
            "support": int(metrics.get("support", 0)),
        })
    pd.DataFrame(report_rows).to_csv(out / "class_metrics.csv", index=False)
    subgroups = subgroup_rows(df)
    pd.DataFrame(subgroups).to_csv(out / "subgroup_audit.csv", index=False)
    with (out / "classification_report.json").open("w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    summary = {
        "method": "rule-based QuestionSense prototype",
        "test_file": str(test_path),
        "n_test_rows_used": len(df),
        "accuracy": accuracy,
        "correct": int((df["coarse_label"] == df["prediction"]).sum()),
        "incorrect": int((df["coarse_label"] != df["prediction"]).sum()),
        "macro_precision": report["macro avg"]["precision"],
        "macro_recall": report["macro avg"]["recall"],
        "macro_f1": report["macro avg"]["f1-score"],
        "classes_in_order": CLASSES,
        "note": "These metrics evaluate wording rules, not a trained ML model. Re-run on the exact test file before citing results.",
    }
    with (out / "run_summary.json").open("w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    fig, ax = plt.subplots(figsize=(8, 7))
    disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=CLASSES)
    disp.plot(ax=ax, values_format="d", colorbar=False)
    ax.set_title("QuestionSense Rule-Based Classifier — TREC Test Set")
    fig.tight_layout()
    fig.savefig(out / "confusion_matrix.png", dpi=200, bbox_inches="tight")
    plt.close(fig)
    print(json.dumps(summary, indent=2))
    print(f"Wrote evaluation outputs to: {out.resolve()}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
