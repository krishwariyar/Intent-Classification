# Project scope and status

This repository is a self-contained, portable implementation of the current QuestionSense prototype's core user flow. The hosted Hatchable project remains deployed separately at https://questionsense.hatchable.site.

Current website behaviour in this codebase:

- single-line question input and Enter button;
- six-class rule-based prediction;
- separate direct-answer lookup;
- explicit not-found handling;
- warm responsive design.

No external answer service or API key is required by this standalone repository. This avoids making a demo result depend on network availability. The separate optional TF-IDF/Logistic Regression training script is included for an experiment with the supplied TREC files, but its output is not plugged into the web app.

Before a public repository release:

- replace team placeholders in any academic documentation;
- confirm the dataset licence and do not force-add ignored Parquet files unless redistribution is permitted;
- rerun the evaluation script using the exact test dataset you will cite;
- replace/add genuine screenshots in `screenshots/`;
- select a project-code licence deliberately; no code licence has been assigned in this archive.
