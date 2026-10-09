import test from "node:test";
import assert from "node:assert/strict";
import { classifyQuestion, answerQuestion, processQuestion } from "../lib/questionsense.mjs";

test("six demo questions return the expected coarse type", () => {
  const examples = [
    ["Who wrote Hamlet?", "HUM"],
    ["What is the capital of Spain?", "LOC"],
    ["How many planets are there in our Solar System?", "NUM"],
    ["What does NATO stand for?", "ABBR"],
    ["What is photosynthesis?", "DESC"],
    ["What is a pangolin?", "ENTY"],
  ];
  for (const [question, expected] of examples) {
    assert.equal(classifyQuestion(question).code, expected, question);
  }
});

test("Hamlet lookup is separate from question classification", () => {
  const answer = answerQuestion("Who wrote Hamlet?");
  assert.equal(answer.answer, "William Shakespeare");
  assert.equal(classifyQuestion("Who wrote Hamlet?").code, "HUM");
});

test("known capital question produces a location answer", () => {
  const result = processQuestion("What is the capital of Spain?");
  assert.equal(result.directAnswer.answer, "Madrid");
  assert.equal(result.code, "LOC");
});

test("unknown direct-answer questions are not fabricated", () => {
  const result = processQuestion("Who is Zerfblor, a made-up person?");
  assert.equal(result.directAnswer.found, false);
  assert.match(result.directAnswer.answer, /No direct answer found/);
  assert.equal(result.code, "HUM");
});

test("empty and overly long inputs are rejected", () => {
  assert.throws(() => processQuestion("   "), /Please enter a question/);
  assert.throws(() => processQuestion("x".repeat(501)), /500 characters/);
});
