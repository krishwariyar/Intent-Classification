# SYSTEM ARCHITECTURE

```text
User enters question
        |
        v
Input validation (non-empty, max 500 characters)
        |
        +-------------------------------+
        |                               |
        v                               v
Wording-rule classifier          Built-in answer lookup
        |                               |
        v                               v
One of six coarse labels         Stored answer or honest not-found message
        |                               |
        +---------------+---------------+
                        |
                        v
            Results page / JSON response
```

The type classifier and answer lookup are independent. A question can receive a predicted type even when the built-in answer lookup returns no direct answer. The rule-based prediction is deterministic for a given input, but it may misclassify unexpected phrasing. The optional trained baseline is an offline experiment and is not wired into the user interface.
