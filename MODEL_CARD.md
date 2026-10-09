# MODEL CARD — QUESTIONSENSE

**Version documented:** Hosted prototype v25 / standalone repository implementation  
**Task:** Broad question-type classification plus a separate direct-answer lookup  
**Status:** Educational prototype; the deployed classifier is rule-based, not a trained ML model.

## Approach

QuestionSense applies an ordered set of wording rules to assign one of six TREC coarse labels: ABBR (abbreviation), ENTY (entity), DESC (description), HUM (human), LOC (location), or NUM (number). A small built-in lookup separately returns answers to supported demonstration questions. The two operations are intentionally kept separate.

## Intended use

Demonstrating basic question-type classification and the distinction between identifying an expected answer type and retrieving a stored answer. It is suitable for classroom demonstrations and controlled examples.

## Out of scope

Open-domain factual question answering, high-stakes decisions, medical/legal/financial advice, non-English or code-mixed text, and any use that assumes current or complete world knowledge.

## Evaluation snapshot

A rule-based evaluation on the supplied TREC test split was previously reported as **264/500 correct (52.8% accuracy)** and **0.621 macro-F1**. The test-class support values in the recorded table are ABBR 9, ENTY 94, DESC 138, HUM 65, LOC 81, and NUM 113. Re-run `scripts/evaluate_rules.py` against the exact test file before publishing or citing metrics; the generated CSV, JSON and confusion matrix are the reproducibility artifacts.

The recorded subgroup audit reported:

| Subgroup | n | Accuracy | Most frequent confusion recorded |
|---|---:|---:|---|
| Question-word first | 485 | 52.4% | DESC → ENTY |
| No question word first | 15 | 66.7% | NUM → ENTY |
| Six words or fewer | 277 | 43.0% | DESC → ENTY |
| More than six words | 223 | 65.0% | NUM → ENTY |

The small “no question word first” subgroup means its accuracy estimate is unstable. These categories are not necessarily causal explanations for performance differences; class composition and phrasing also differ. The included evaluation script regenerates these statistics from the actual dataset.

## Explainability

The classifier is inspectable rule-by-rule. For example, “Who wrote Hamlet?” matches the HUM wording cue “who”. The direct answer “William Shakespeare” comes from a separate built-in answer lookup. SHAP and LIME were not used because the current website classifier is not a trained statistical model.

## Limitations and risks

- Unseen or ambiguous wording may fall through to ENTY by default.
- The answer lookup covers a small list of predefined fact patterns and is not a general knowledge base.
- Heuristic score bars are not calibrated probabilities and must not be interpreted as confidence estimates.
- The results snapshot should be regenerated from the exact file before submission.
- The optional TF-IDF/Logistic Regression script is a separate experiment; it is not integrated into current website predictions.

## Recommendations

Expand labelled test coverage, compare the rule-based system with the optional trained baseline, assess performance by class and question style, review errors, and only integrate a trained model after testing the full web flow.
