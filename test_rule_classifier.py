import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from rule_classifier import predict


class RuleClassifierTests(unittest.TestCase):
    def test_six_acceptance_examples(self):
        examples = {
            "Who wrote Hamlet?": "HUM",
            "What is the capital of Spain?": "LOC",
            "How many planets are there in our Solar System?": "NUM",
            "What does NATO stand for?": "ABBR",
            "What is photosynthesis?": "DESC",
            "What is a pangolin?": "ENTY",
        }
        for question, expected in examples.items():
            with self.subTest(question=question):
                self.assertEqual(predict(question), expected)


if __name__ == "__main__":
    unittest.main()
