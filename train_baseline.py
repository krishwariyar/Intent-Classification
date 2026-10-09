"""Train an optional TF-IDF + Logistic Regression baseline on TREC Parquet files.

This experiment is NOT integrated into the current website's predictions.
Usage: python scripts/train_baseline.py --train data/raw/trec-train-par.parquet --test data/raw/trec-test-par.parquet
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import sys

import matplotlib.pyplot as plt
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, ConfusionMatrixDisplay, confusion_matrix
from sklearn.pipeline import Pipeline
import joblib

from rule_classifier import CLASSES


def load(path: Path):
    if not path.exists():
        raise FileNotFoundError(path)
    frame = pd.read_parquet(path)
    missing = {"text", "coarse_label"} - set(frame.columns)
    if missing:
        raise ValueError(f"{path}: missing columns {sorted(missing)}")
    frame = frame.dropna(subset=["text", "coarse_label"])
    return frame["text"].astype(str).tolist(), frame["coarse_label"].astype(str).str.upper().tolist()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--train", default="data/raw/trec-train-par.parquet")
    parser.add_argument("--test", default="data/raw/trec-test-par.parquet")
    parser.add_argument("--out-dir", default="outputs/baseline")
    args = parser.parse_args()
    try:
        x_train, y_train = load(Path(args.train))
        x_test, y_test = load(Path(args.test))
    except (FileNotFoundError, ValueError) as exc:
        print(str(exc), file=sys.stderr)
        return 2
    invalid = (set(y_train) | set(y_test)) - set(CLASSES)
    if invalid:
        print(f"Unexpected coarse labels: {sorted(invalid)}", file=sys.stderr)
        return 2
    model = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), lowercase=True, strip_accents="unicode", sublinear_tf=True)),
        ("classifier", LogisticRegression(max_iter=2000, random_state=42)),
    ])
    model.fit(x_train, y_train)
    predictions = model.predict(x_test)
    report = classification_report(y_test, predictions, labels=CLASSES, output_dict=True, zero_division=0)
    out = Path(args.out_dir)
    out.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, out / "tfidf_logistic_regression.joblib")
    with (out / "classification_report.json").open("w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    summary = {
        "model": "TF-IDF (unigrams + bigrams) + Logistic Regression",
        "train_rows": len(x_train),
        "test_rows": len(x_test),
        "accuracy": accuracy_score(y_test, predictions),
        "macro_f1": report["macro avg"]["f1-score"],
        "note": "Separate experimental baseline. It is not used by the current QuestionSense website unless explicitly integrated and re-tested.",
    }
    with (out / "run_summary.json").open("w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    fig, ax = plt.subplots(figsize=(8, 7))
    ConfusionMatrixDisplay(confusion_matrix(y_test, predictions, labels=CLASSES), display_labels=CLASSES).plot(ax=ax, values_format="d", colorbar=False)
    ax.set_title("TF-IDF + Logistic Regression — TREC Test Set")
    fig.tight_layout()
    fig.savefig(out / "confusion_matrix.png", dpi=200, bbox_inches="tight")
    plt.close(fig)
    print(json.dumps(summary, indent=2))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
