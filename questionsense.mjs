export const CLASSES = [
  { code: "ABBR", label: "Abbreviation", icon: "A", description: "a shortened form or its full meaning" },
  { code: "ENTY", label: "Entity", icon: "E", description: "a thing, object, substance, or named entity" },
  { code: "DESC", label: "Description", icon: "D", description: "a definition, explanation, or description" },
  { code: "HUM", label: "Human", icon: "H", description: "a person or group of people" },
  { code: "LOC", label: "Location", icon: "L", description: "a place or geographic location" },
  { code: "NUM", label: "Number", icon: "#", description: "a quantity, count, date, or other numerical value" }
];

const normalize = (value) => String(value ?? "").toLowerCase().replace(/[?!.]+$/g, "").trim().replace(/\s+/g, " ");
const has = (pattern, text) => pattern.test(text);

/**
 * Transparent rule-based prediction. This is the method currently represented
 * by the QuestionSense demo; it is not a trained machine-learning model.
 */
export function classifyQuestion(question) {
  const s = String(question ?? "").toLowerCase().trim();
  let code = "ENTY";

  if (/\b(stand for|stands for|abbreviation|acronym|initials)\b/.test(s)) code = "ABBR";
  else if (/\b(who|whose|whom|which person|what person|which president|which actor|which singer|which author|which scientist)\b/.test(s)) code = "HUM";
  else if (/\bwhat is the capital of\b/.test(s) || /\b(where|capital of|what country|which country|what city|which city|what state|which state|what continent|what river|what mountain|what ocean)\b/.test(s)) code = "LOC";
  else if (/\b(how many|how much|how old|how long|how far|how tall|how large|how often|what year|what date|what percentage|what percent|population|how fast|how heavy)\b/.test(s)) code = "NUM";
  else if (/\bwhat is photosynthesis\b|\b(why|how does|how do|how is|how are|what causes|definition|what does .* mean|explain|describe|what happens|what is the meaning)\b/.test(s)) code = "DESC";
  else if (/\bwhat is a pangolin\b|\bwhat is (a|an)\b/.test(s)) code = "ENTY";
  else if (/\b(what|which|name)\b/.test(s)) code = "ENTY";

  const category = CLASSES.find((item) => item.code === code);
  const strong = (code === "HUM" && /\b(who|whose|whom)\b/.test(s)) ||
    (code === "LOC" && /capital of|where/.test(s)) ||
    (code === "NUM" && /how many|how much|how old|what year|what date/.test(s)) ||
    (code === "ABBR" && /stand for|stands for|acronym|abbreviation/.test(s));
  const main = strong ? 82 : ((code === "DESC" || code === "ENTY") ? 78 : 66);
  const rest = Math.floor((100 - main) / 5);
  const scores = CLASSES.map((item) => ({
    code: item.code,
    label: item.label,
    percent: item.code === code ? main : rest
  })).sort((a, b) => b.percent - a.percent);

  return {
    code,
    label: category.label,
    icon: category.icon,
    description: category.description,
    scores,
    method: "rule-based",
    explanation: "Category estimated from transparent wording rules. These comparative scores are not probabilities from a trained model."
  };
}

/** Direct answer lookup is deliberately separate from question classification. */
export function answerQuestion(question) {
  const s = normalize(question);
  const entries = [
    [/capital of spain/, "Madrid", "Madrid is the capital of Spain."],
    [/capital of france/, "Paris", "Paris is the capital of France."],
    [/capital of china/, "Beijing", "Beijing is the capital of China."],
    [/capital of india/, "New Delhi", "New Delhi is the capital of India."],
    [/capital of japan/, "Tokyo", "Tokyo is the capital of Japan."],
    [/capital of italy/, "Rome", "Rome is the capital of Italy."],
    [/capital of germany/, "Berlin", "Berlin is the capital of Germany."],
    [/capital of australia/, "Canberra", "Canberra is the capital of Australia."],
    [/capital of canada/, "Ottawa", "Ottawa is the capital of Canada."],
    [/capital of portugal/, "Lisbon", "Lisbon is the capital of Portugal."],
    [/capital of brazil/, "Brasília", "Brasília is the capital of Brazil."],
    [/capital of mexico/, "Mexico City", "Mexico City is the capital of Mexico."],
    [/capital of russia/, "Moscow", "Moscow is the capital of Russia."],
    [/capital of bangladesh/, "Dhaka", "Dhaka is the capital of Bangladesh."],
    [/capital of nepal/, "Kathmandu", "Kathmandu is the capital of Nepal."],
    [/capital of pakistan/, "Islamabad", "Islamabad is the capital of Pakistan."],
    [/capital of the united kingdom|capital of uk\b/, "London", "London is the capital of the United Kingdom."],
    [/capital of the united states|capital of usa\b/, "Washington, D.C.", "Washington, D.C. is the capital of the United States."],
    [/where is (the )?eiffel tower|eiffel tower located/, "Paris, France", "The Eiffel Tower is in Paris, France."],
    [/where is (the )?taj mahal/, "Agra, India", "The Taj Mahal is in Agra, Uttar Pradesh, India."],
    [/who wrote hamlet|author of hamlet/, "William Shakespeare", "William Shakespeare wrote Hamlet."],
    [/who painted the mona lisa/, "Leonardo da Vinci", "Leonardo da Vinci painted the Mona Lisa."],
    [/who invented the telephone/, "Alexander Graham Bell", "Alexander Graham Bell is widely credited with patenting and popularising the telephone; its history has multiple contributors."],
    [/largest planet/, "Jupiter", "Jupiter is the largest planet in our Solar System."],
    [/how many planets/, "8 planets", "There are eight recognised planets in our Solar System."],
    [/what does nato stand for|what is nato/, "North Atlantic Treaty Organization", "NATO stands for North Atlantic Treaty Organization."],
    [/what does asap stand for/, "As soon as possible", "ASAP means ‘as soon as possible.’"],
    [/what does photosynthesis mean|what is photosynthesis/, "Photosynthesis", "Photosynthesis is the process plants use to convert light energy into chemical energy."],
    [/what is a pangolin|what are pangolins/, "A mammal covered in protective scales", "Pangolins are mammals known for their protective keratin scales."]
  ];
  for (const [pattern, answer, note] of entries) {
    if (has(pattern, s)) return { answer, note, source: "QuestionSense built-in answer set", found: true };
  }
  return {
    answer: "No direct answer found for this question.",
    note: "The classifier can still estimate the expected answer type. This prototype has a limited, transparent answer set and does not know every fact.",
    source: "No matching built-in answer",
    found: false
  };
}

export function processQuestion(question) {
  const value = String(question ?? "").trim();
  if (!value) throw new Error("Please enter a question.");
  if (value.length > 500) throw new Error("Keep the question under 500 characters.");
  return { question: value, ...classifyQuestion(value), directAnswer: answerQuestion(value) };
}
