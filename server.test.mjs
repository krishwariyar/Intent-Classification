import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../server.mjs";

test("homepage, GET form submission, API and empty-input validation work", async (t) => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve())));
  const address = server.address();
  const root = `http://127.0.0.1:${address.port}`;

  const home = await fetch(root);
  assert.equal(home.status, 200);
  const html = await home.text();
  assert.match(html, /QuestionSense/);
  assert.match(html, /name="question"/);
  assert.match(html, />Enter/);

  const result = await fetch(`${root}/?question=${encodeURIComponent("Who wrote Hamlet?")}`);
  assert.equal(result.status, 200);
  const resultsHtml = await result.text();
  assert.match(resultsHtml, /William Shakespeare/);
  assert.match(resultsHtml, /Human/);

  const api = await fetch(`${root}/api/classify?question=${encodeURIComponent("What is the capital of Spain?")}`);
  assert.equal(api.status, 200);
  const json = await api.json();
  assert.equal(json.code, "LOC");
  assert.equal(json.directAnswer.answer, "Madrid");

  const empty = await fetch(`${root}/?question=%20%20%20`);
  assert.equal(empty.status, 400);
  assert.match(await empty.text(), /Please enter a question/);
});
