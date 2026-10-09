# Contributing

This is a student NLP prototype. Keep changes small, readable and testable.

- Preserve the distinction between answer-type classification and direct-answer lookup.
- Never describe rule scores as calibrated probabilities.
- Do not add evaluation numbers without generating them from the exact test file.
- Keep dataset licensing notes intact unless the exact file's terms have been verified.
- Run `npm test` and `python -m unittest discover -s tests -p 'test_*.py'` before submitting changes.
