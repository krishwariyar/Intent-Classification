# DATASET CARD

## Dataset

TREC Question Classification Dataset, using the coarse-label task.

## Local files expected

- `data/raw/trec-train-par.parquet`
- `data/raw/trec-test-par.parquet`

## Fields

- `text`: question text.
- `coarse_label`: one of ABBR, ENTY, DESC, HUM, LOC, NUM.
- `fine_label`: optional fine-grained category if present in the supplied version.

## Use in this repository

`scripts/evaluate_rules.py` evaluates the present wording rules against the held-out test file. `scripts/train_baseline.py` trains a separate TF-IDF + Logistic Regression experimental baseline on train data and evaluates on test data. Do not use the test set for model fitting.

## Source and licensing

The TREC question-classification collection is associated with the Cognitive Computation Group at the University of Pennsylvania. Reference pages:

- https://cogcomp.seas.upenn.edu/Data/QA/QC/
- https://huggingface.co/datasets/CogComp/trec

Check the terms for the exact dataset copy being used. The Hugging Face listing has been observed to show its license as unknown. The supplied Parquet files are therefore excluded from Git by default. Do not redistribute data files publicly until permissions are confirmed.

## Data quality checks

The evaluation scripts check required fields and reject labels outside the six coarse classes. Always report the actual row counts from the supplied file version instead of assuming the counts of another TREC release.
