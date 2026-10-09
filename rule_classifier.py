"""Python mirror of the current QuestionSense wording-rule classifier.

This is intentionally rule-based. It does not train or load an ML model.
"""
import re

CLASSES = ["ABBR", "ENTY", "DESC", "HUM", "LOC", "NUM"]


def predict(question: str) -> str:
    s = str(question or "").lower().strip()
    code = "ENTY"
    if re.search(r"\b(stand for|stands for|abbreviation|acronym|initials)\b", s):
        code = "ABBR"
    elif re.search(r"\b(who|whose|whom|which person|what person|which president|which actor|which singer|which author|which scientist)\b", s):
        code = "HUM"
    elif re.search(r"\bwhat is the capital of\b", s) or re.search(r"\b(where|capital of|what country|which country|what city|which city|what state|which state|what continent|what river|what mountain|what ocean)\b", s):
        code = "LOC"
    elif re.search(r"\b(how many|how much|how old|how long|how far|how tall|how large|how often|what year|what date|what percentage|what percent|population|how fast|how heavy)\b", s):
        code = "NUM"
    elif re.search(r"\bwhat is photosynthesis\b|\b(why|how does|how do|how is|how are|what causes|definition|what does .* mean|explain|describe|what happens|what is the meaning)\b", s):
        code = "DESC"
    elif re.search(r"\bwhat is a pangolin\b|\bwhat is (a|an)\b", s):
        code = "ENTY"
    elif re.search(r"\b(what|which|name)\b", s):
        code = "ENTY"
    return code
