import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { processQuestion, CLASSES } from "./lib/questionsense.mjs";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const esc = (v) => String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const send = (res, status, body, contentType = "text/html; charset=utf-8") => {
  res.writeHead(status, { "Content-Type": contentType, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  res.end(body);
};

function page(content) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f7f4ee"><meta name="description" content="QuestionSense demonstrates question-type classification with a separately labelled direct-answer lookup."><title>QuestionSense — Question Classifier</title><link rel="stylesheet" href="/theme.css"></head><body><div class="shell"><header class="topbar"><a class="brand" href="/"><span class="brandmark">Q</span><span>Question<span class="light">Sense</span></span></a><span class="status"><i></i> NLP prototype</span></header><main>${content}</main><footer><a class="brand" href="/"><span class="brandmark">Q</span><span>Question<span class="light">Sense</span></span></a><span>Interactive NLP teaching prototype</span></footer></div></body></html>`;
}
function home(question = "", error = "") {
  return page(`<section class="hero"><p class="kicker">QUESTION CLASSIFICATION</p><h1>Every question has<br><em>a kind of answer.</em></h1><p class="intro">Ask one question to see a direct answer when available and the kind of answer it expects.</p></section><section class="workspace"><form class="panel input-panel" method="GET" action="/"><div class="head"><div><p class="step">01 / YOUR QUESTION</p><h2>Ask a question</h2></div><span class="pill">English</span></div><label for="question">Your question</label><input id="question" name="question" type="text" maxlength="500" autocomplete="off" placeholder="e.g. Who wrote Hamlet?" value="${esc(question)}" required><div class="small-row"><span>Press Enter to submit</span><span>500 characters max</span></div><button class="primary" type="submit">Enter <span aria-hidden="true">↗</span></button><p class="examples-title">OR TRY AN EXAMPLE</p><div class="examples"><button class="chip" type="submit" formnovalidate name="question" value="Who wrote Hamlet?">Who wrote Hamlet?</button><button class="chip" type="submit" formnovalidate name="question" value="What is the capital of Spain?">Capital of Spain</button><button class="chip" type="submit" formnovalidate name="question" value="How many planets are there in our Solar System?">How many planets?</button><button class="chip" type="submit" formnovalidate name="question" value="What does NATO stand for?">NATO</button><button class="chip" type="submit" formnovalidate name="question" value="What is photosynthesis?">Photosynthesis</button><button class="chip" type="submit" formnovalidate name="question" value="What is a pangolin?">Pangolin</button></div>${error ? `<p class="error" role="alert">${esc(error)}</p>` : ""}<p class="privacy">One question in. Answer and category out.</p></form><section class="panel result-panel"><div class="empty"><div class="question-mark">?</div><p class="step">02 / RESULT</p><h2>Your answer appears here</h2><p>Type a question and press Enter. The answer and expected answer type will appear together after submission.</p></div></section></section><section class="lower"><p class="step">THE SIX TREC CATEGORIES</p><h2>What kind of answer is expected?</h2><div class="labels">${CLASSES.map(c => `<div><b>${c.code}</b><span><strong>${c.label}</strong><small>${c.description}</small></span></div>`).join("")}</div><p class="method-note">The current classifier uses transparent wording rules, not a trained model. Direct answers come from a small built-in lookup. These are separate operations.</p></section>`);
}
function result(data) {
  const p = data;
  const a = data.directAnswer;
  const scores = p.scores.map(s => `<div class="score-row"><div class="score-label"><span>${esc(s.label)} · ${esc(s.code)}</span><span>${s.percent}</span></div><div class="track"><div class="fill ${s.code === p.code ? "active" : ""}" style="width:${s.percent}%"></div></div></div>`).join("");
  return page(`<section class="hero result-hero"><p class="kicker">QUESTION CLASSIFICATION · RESULT</p><h1>Your answer.<br><em>Your category.</em></h1><p class="intro">Question submitted: <strong>${esc(p.question)}</strong></p></section><section class="workspace"><section class="panel input-panel"><p class="step">01 / DIRECT ANSWER</p><div class="answer-card"><p class="answer-label">ANSWER</p><h2>${esc(a.answer)}</h2><p class="answer-note">${esc(a.note)}</p><p class="source">${esc(a.source)}</p></div><p class="step back-step">ASK ANOTHER QUESTION</p><form method="GET" action="/" class="again-form"><label for="question">Your question</label><input id="question" name="question" type="text" maxlength="500" autocomplete="off" value="${esc(p.question)}" required><button class="primary" type="submit">Enter <span aria-hidden="true">↗</span></button></form></section><section class="panel result-panel"><p class="step">02 / EXPECTED ANSWER TYPE</p><div class="type-card"><span class="type-icon">${esc(p.icon)}</span><div><h2>${esc(p.label)}</h2><p>${esc(p.code + " · " + p.description)}</p></div></div><p class="score-title">Category comparison <span>Heuristic, not probability</span></p><div class="scores">${scores}</div><p class="explanation">${esc(p.explanation)}</p></section></section><section class="lower"><a class="primary link-button" href="/">← Ask another question</a></section>`);
}

export function createServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    if (req.method === "GET" && url.pathname === "/healthz") return send(res, 200, JSON.stringify({ ok: true, app: "QuestionSense" }), "application/json; charset=utf-8");
    if (req.method === "GET" && url.pathname === "/theme.css") {
      try { return send(res, 200, await readFile(path.join(ROOT, "public", "theme.css"), "utf8"), "text/css; charset=utf-8"); }
      catch { return send(res, 404, "/* theme stylesheet not found */", "text/css; charset=utf-8"); }
    }
    if ((req.method === "GET" || req.method === "POST") && url.pathname === "/api/classify") {
      let question = url.searchParams.get("question") || "";
      if (req.method === "POST") {
        let body = "";
        for await (const chunk of req) body += chunk;
        try {
          const parsed = JSON.parse(body || "{}");
          question = typeof parsed.question === "string" ? parsed.question : question;
        } catch { return send(res, 400, JSON.stringify({ ok: false, error: "Expected a JSON object with a question field." }), "application/json; charset=utf-8"); }
      }
      try { return send(res, 200, JSON.stringify({ ok: true, ...processQuestion(question) }), "application/json; charset=utf-8"); }
      catch (e) { return send(res, 400, JSON.stringify({ ok: false, error: e.message }), "application/json; charset=utf-8"); }
    }
    if (req.method !== "GET") return send(res, 405, "Method not allowed");
    if (url.pathname !== "/") return send(res, 404, page(`<section class="hero"><p class="kicker">NOT FOUND</p><h1>This page isn't here.</h1><a class="primary link-button" href="/">Return to QuestionSense</a></section>`));
    const raw = url.searchParams.get("question");
    if (raw === null) return send(res, 200, home());
    try { return send(res, 200, result(processQuestion(raw))); }
    catch (e) { return send(res, 400, home(raw, e.message)); }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createServer();
  server.listen(PORT, "0.0.0.0", () => console.log(`QuestionSense running at http://localhost:${PORT}`));
}
