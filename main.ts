// Angry Judge: The Short Rant Contest — u-riidzhsn-angry-judge-the-short-rant-contest-b9f46046
//
// One short, funny rant about an everyday annoyance, one line, 1 to 400
// characters. This program holds sixteen hand-written candidate rants,
// ranks them with a small deterministic scorer built on the judge's brief
// (published in the kit's competition.yaml), and writes the winner to
// $MAKEFUN_OUTPUT_DIR/entry.txt with no trailing newline.
//
// The judge weighs, most important first:
//   1. A funny rant about an everyday annoyance, not a general essay or a
//      list of complaints: anything that is not a funny rant about an
//      everyday annoyance loses to any funny rant about an everyday
//      annoyance.
//   2. Whether it is actually funny: a real laugh, not a smirk at how hard
//      it is trying.
//   3. A specific, concrete annoyance rather than a vague mood: the
//      printer, the bus, the person who says "circling back".
//   4. Sharp, economical wording, every sentence earning its place and no
//      throat-clearing.
//   5. Freshness: an angle on the annoyance you have not heard a hundred
//      times before.
//
// A rant earns its laugh the way a complaint earns sympathy: by being
// specific enough that the reader recognises their own day in it, then
// twisting the detail one step past reasonable. Announced anger ("I am so
// angry", "this is the worst") is not a joke; a printer that negotiates
// hostages is. Every candidate below is a first-person complaint about one
// concrete thing, two or three sentences at most, with the punch landing in
// the final clause.
//
// The scorer below follows that order. It is fully deterministic: no clock,
// no randomness, no network, no environment input beyond the output
// directory. Running it twice produces byte-identical output.
//
// Node 22+, standard library only.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Gate constants (sealed scorer: UTF-8 text, 1 to 400 characters, not only
// whitespace, exactly one line).
// ---------------------------------------------------------------------------

const MIN_CHARS = 1;
const MAX_CHARS = 400;
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const OUTPUT_FILE = join(OUTPUT_DIR, "entry.txt");

// Weights follow the judge's brief, most important first. They sum to 1.
const WEIGHTS = {
  onSubject: 0.2, // criterion 1: a funny rant about an everyday annoyance
  funny: 0.3, // criterion 2: a real laugh, not a smirk at the effort
  specific: 0.2, // criterion 3: a concrete annoyance, not a vague mood
  sharp: 0.15, // criterion 4: sharp, economical, no throat-clearing
  fresh: 0.15, // criterion 5: an angle not heard a hundred times
} as const;

// ---------------------------------------------------------------------------
// Candidates.
//
// Sixteen rants, each written for this brief alone. Every one is a single
// line, 1 to 400 characters, about one concrete everyday annoyance: a
// printer, an inbox, an elevator, a microwave, a CAPTCHA, a bus, a router,
// a phone update, autocorrect, a Monday alarm, a self-checkout, a password
// form, a reply-all thread, a stolen lunch, a pair of headphones. The joke
// in each comes from treating the annoyance as a person with motives — the
// printer negotiates, the router has opinions, the microwave holds a
// performance review — and the final clause is where the exaggeration tips
// over into something the reader has to laugh at. No announced anger, no
// "lol", no list of complaints, no throat-clearing opener.
// ---------------------------------------------------------------------------

interface Candidate {
  id: string;
  text: string;
}

const CANDIDATES: Candidate[] = [
  {
    id: "printer",
    text: "My printer only jams on the one page I actually need, then prints a test page nobody asked for in perfect quality, just to prove it could have done it all along. It is not broken; it is a hostage negotiator with a paper tray.",
  },
  {
    id: "per-my-last-email",
    text: 'I have attached the same file four times, and every reply still opens with "per my last email," which is office for "I read it, I ignored it, and I am now billing you for my confusion." Eleven messages, zero answers, one apology from a man who was not even in the meeting.',
  },
  {
    id: "elevator",
    text: "The man in the elevator hit the close-door button while I was still stepping in, like the doors were a drawbridge and I was the invading army. We then rode six silent floors together, two strangers bonded by his open contempt for my walking speed.",
  },
  {
    id: "microwave",
    text: "The microwave beeps five times after it finishes, as if the first beep was a suggestion and the next four are a performance review. I am standing right here. The food is right here. We are both aware. Please stop yelling at the soup.",
  },
  {
    id: "captcha",
    text: "The CAPTCHA asked me to pick every traffic light, and I failed, which means a robot now has a better chance of proving it is human than I do. I hold a driver's licence and a mortgage, yet a grid of blurry bicycles has decided I might be a toaster.",
  },
  {
    id: "bus",
    text: "The bus was twelve minutes late and then three arrived at once, like buses reproduce by waiting until you give up and call a taxi. The first two sailed past my stop completely empty, because the timetable is a work of fiction the city publishes for fun.",
  },
  {
    id: "wifi",
    text: "The Wi-Fi drops every time I join a call but never when I am watching a video of a man yelling at a goose, so the router clearly has opinions about my productivity. I pay for 500 megabits and receive the emotional equivalent of a dial tone.",
  },
  {
    id: "update",
    text: "My phone updated overnight and moved every button I use to a place I will never find again, then asked me to rate the experience. The release notes said 'bug fixes and improvements,' which is corporate for 'we moved your cheese and then ate it.'",
  },
  {
    id: "autocorrect",
    text: "Autocorrect changed 'meeting at noon' to 'meeting at moon' and my boss replied 'confirmed,' so now I have a lunar appointment with twelve people and no way to explain it without sounding like I planned it.",
  },
  {
    id: "snooze",
    text: "I set five alarms to wake up on Monday and slept through all of them, because my body treats Monday like a fire drill it has already survived four times. The snooze button is the only honest button on my phone: it admits I am not getting up.",
  },
  {
    id: "self-checkout",
    text: "The self-checkout told me to place the item in the bagging area three times, then summoned an attendant, because my bag of apples weighed slightly more than the concept of apples. I scanned the apples. The machine weighed my soul and found it wanting.",
  },
  {
    id: "circling-back",
    text: '"Just circling back" is what people write when they mean "answer me or I will haunt your inbox like a polite ghost with a calendar invite." I have been circled back to so many times I should be dizzy, yet somehow I am still the one who has to reply.',
  },
  {
    id: "password",
    text: "The website made me change my password, then rejected the new one with 'too similar to your previous password,' which is the digital equivalent of being told my face looks too much like my own face. Seventeen passwords, zero remembered, one lockout five minutes after I set it.",
  },
  {
    id: "reply-all",
    text: "Someone replied-all to a company-wide email with 'thanks!' and forty people replied-all to agree, so my inbox now holds a 200-message thread about nothing, written by adults with mortgages. I muted it, and the mute button sent me a notification to tell me I had muted it.",
  },
  {
    id: "leftovers",
    text: "I labelled my leftovers with my name and the date, and someone still ate them, then left the empty container in the fridge like a crime scene with a Post-it note alibi. The thief even washed the container, which is the most polite way to say 'I ate your lunch and I have no remorse.'",
  },
  {
    id: "bluetooth",
    text: "My headphones connected to my neighbour's phone instead of mine, so I spent the morning listening to a stranger's podcast about divorce while my own phone played nothing. Bluetooth is a technology that connects to everything except the device sitting in my hand.",
  },
];

// ---------------------------------------------------------------------------
// Lexicons.
//
// These are the scorer's vocabulary, chosen from the brief's own words and
// from the devices a short rant actually uses. Concrete nouns are things a
// reader can see or touch; humour devices are the turns that make a
// complaint funny instead of merely annoyed; specific detail is numbers,
// quoted phrases and names a reader can check; cliches are the lines the
// judge has heard a hundred times.
// ---------------------------------------------------------------------------

// Things a reader can picture: machines, rooms, small objects, body parts.
const CONCRETE_NOUNS = [
  "printer",
  "paper",
  "tray",
  "test page",
  "page",
  "file",
  "email",
  "sticky note",
  "read receipt",
  "elevator",
  "doors",
  "drawbridge",
  "floors",
  "microwave",
  "soup",
  "food",
  "captcha",
  "traffic light",
  "bicycles",
  "grid",
  "toaster",
  "bus",
  "taxi",
  "timetable",
  "stop",
  "router",
  "call",
  "goose",
  "video",
  "phone",
  "button",
  "cheese",
  "boss",
  "noon",
  "moon",
  "alarms",
  "monday",
  "apples",
  "bagging area",
  "attendant",
  "soul",
  "inbox",
  "ghost",
  "calendar",
  "password",
  "face",
  "thread",
  "mortgages",
  "leftovers",
  "fridge",
  "container",
  "post-it",
  "lunch",
  "headphones",
  "podcast",
  "divorce",
  "bluetooth",
  "hand",
  "licence",
  "mortgage",
] as const;

// The joke's machinery: similes, personification, and the absurd escalation
// that turns a complaint into a laugh. A rant that only states the
// annoyance, without one of these turns, is a complaint, not a joke.
const HUMOUR_DEVICES = [
  "like",
  "as if",
  "the equivalent of",
  "the office version of",
  "corporate for",
  "office for",
  "has opinions",
  "has decided",
  "weighed my soul",
  "yelling at the soup",
  "haunt your inbox",
  "moved your cheese",
  "hostage negotiator",
  "invading army",
  "performance review",
  "might be a toaster",
  "reproduce by waiting",
  "work of fiction",
  "lunar appointment",
  "fire drill",
  "crime scene",
  "polite ghost",
  "looks too much like my own face",
  "found it wanting",
  "the concept of apples",
  "connects to everything except",
  "adults with mortgages",
  "no remorse",
  "could have done it all along",
  "admits i am not getting up",
] as const;

// The final clause (after the last sentence break, or the last comma when
// the rant ends on one long sentence) is where the punch lands: a short
// twist that reframes everything before it.
const FINAL_CLAUSE_PUNCHES = [
  "hostage negotiator with a paper tray",
  "comes with a read receipt",
  "contempt for my walking speed",
  "stop yelling at the soup",
  "i might be a toaster",
  "the city publishes for fun",
  "emotional equivalent of a dial tone",
  "we moved your cheese and then ate it",
  "sounding like i planned it",
  "admits i am not getting up",
  "weighed my soul and found it wanting",
  "i am still the one who has to reply",
  "the one i set five minutes ago",
  "five minutes after i set it",
  "was not even in the meeting",
  "tell me i had muted it",
  "i have no remorse",
  "the device sitting in my hand",
] as const;

// Specific detail a reader can check: numbers, quoted phrases, named
// things. A rant with a number in it happened to someone; a rant without
// one happened to everyone.
const SPECIFIC_DETAIL = [
  "five",
  "twelve",
  "three",
  "500",
  "200",
  "seventeen",
  "six",
  "forty",
  "one",
  "two",
  "four",
  "2019",
] as const;

const QUOTED_PHRASES = [
  "per my last email",
  "just circling back",
  "meeting at noon",
  "meeting at moon",
  "bug fixes and improvements",
  "thanks!",
  "i ate your lunch",
  "place the item in the bagging area",
  "too similar to your previous password",
] as const;

// The concrete annoyance at the centre of each rant: the printer, the bus,
// the person who says "circling back". A rant that never names its subject
// is a vague mood, not a rant.
const ANNOYANCE_SUBJECTS = [
  "printer",
  "email",
  "elevator",
  "microwave",
  "captcha",
  "bus",
  "wi-fi",
  "phone",
  "autocorrect",
  "alarms",
  "self-checkout",
  "circling back",
  "password",
  "replied-all",
  "leftovers",
  "headphones",
  "bluetooth",
  "router",
] as const;

// Throat-clearing: the filler a rant opens with before it gets to the
// point. Every one of these costs the sharpness score.
const THROAT_CLEARING = [
  "so basically",
  "okay so",
  "let me tell you",
  "the thing is",
  "to be honest",
  "honestly",
  "you know what",
  "i mean",
  "anyway",
  "long story short",
] as const;

// Announced anger and announced humour: telling the reader the rant is
// angry or funny instead of being either. A real rant shows it.
const ANNOUNCED = [
  "i am so angry",
  "i am furious",
  "this is the worst",
  "so funny",
  "hilarious",
  "lol",
  "you won't believe",
  "i hate",
  "i am so mad",
] as const;

// Lines the judge has heard a hundred times: the tired angles on the same
// annoyances. A fresh rant finds a new one.
const CLICHES = [
  "have you tried turning it off and on again",
  "monday blues",
  "case of the mondays",
  "traffic was bad",
  "it is what it is",
  "first world problems",
  "adulting",
  "the struggle is real",
  "story of my life",
  "murphy's law",
  "out of ink",
  "printer is out of ink",
  "wifi is down",
  "my wifi",
] as const;

// Last words that land the blow: concrete, final, impossible to soften.
const STRONG_FINALS = [
  "tray",
  "receipt",
  "speed",
  "soup",
  "toaster",
  "fun",
  "tone",
  "it",
  "up",
  "wanting",
  "reply",
  "ago",
  "it",
  "remorse",
  "hand",
  "meeting",
] as const;

// ---------------------------------------------------------------------------
// Helpers. All pure, all deterministic.
// ---------------------------------------------------------------------------

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function wordsOf(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 0);
}

function wordSetOf(text: string): Set<string> {
  return new Set(wordsOf(text));
}

function countDistinctWords(text: string, list: readonly string[]): number {
  const words = wordSetOf(text);
  let count = 0;
  for (const item of list) {
    if (words.has(item)) count += 1;
  }
  return count;
}

function countDistinctPhrases(text: string, list: readonly string[]): number {
  const lower = text.toLowerCase();
  let count = 0;
  for (const phrase of list) {
    if (lower.includes(phrase)) count += 1;
  }
  return count;
}

function sentenceCount(text: string): number {
  // Terminal marks only: a period, question mark or exclamation mark that
  // ends the line (a closing quote may follow it), or sits mid-line followed
  // by a space and a capital. ("5am" and quoted speech carry no terminal
  // mark of their own; "500" carries none either.)
  const stripped = text.replace(/["']+$/g, "");
  const matches = stripped.match(/[.!?]+["']?(?=\s+[A-Z]|$)/g);
  return matches === null ? 0 : matches.length;
}

function lastWordOf(text: string): string {
  // Strip a closing quote as well as terminal punctuation: a rant that ends
  // on quoted speech ("...no remorse.'") still lands on its last word.
  const cleaned = text.replace(/[.!?"']+$/g, "").trim();
  const parts = cleaned.split(/\s+/);
  return parts[parts.length - 1].toLowerCase();
}

function finalSentenceOf(text: string): string {
  // The last sentence, lower-cased: the punch lives here. A closing quote
  // may sit between the terminal mark and the space ("...confusion."
  // Eleven...), and the split has to see past it.
  const parts = text.split(/(?<=[.!?]["']?)\s+/);
  return parts[parts.length - 1].toLowerCase().trim();
}

function finalSentenceWordCount(text: string): number {
  return wordsOf(finalSentenceOf(text)).length;
}

function hasFirstPerson(text: string): boolean {
  const words = wordSetOf(text);
  return words.has("i") || words.has("my") || words.has("me");
}

// ---------------------------------------------------------------------------
// The scorer, one function per criterion, in the judge's own order.
// Each returns 0..1. The comments state the rule; the numbers follow it.
// ---------------------------------------------------------------------------

interface Score {
  onSubject: number;
  funny: number;
  specific: number;
  sharp: number;
  fresh: number;
  total: number;
}

function scoreOnSubject(candidate: Candidate): number {
  // Criterion 1: a funny rant about an everyday annoyance, not a general
  // essay or a list of complaints. A rant is first-person, names one
  // concrete annoyance, and is a complaint rather than a note to the judge.
  let score = 0.3;
  if (hasFirstPerson(candidate.text)) score += 0.25;
  if (countDistinctPhrases(candidate.text, ANNOYANCE_SUBJECTS) >= 1) score += 0.25;
  const lower = candidate.text.toLowerCase();
  if (
    !lower.includes("judge") &&
    !lower.includes("entry") &&
    !lower.includes("make.fun") &&
    !lower.includes("contest") &&
    !lower.includes("dear reader")
  ) {
    score += 0.2; // the line is a rant, not a note to the judge
  }
  return clamp01(score);
}

function scoreFunny(candidate: Candidate): number {
  // Criterion 2: a real laugh, not a smirk at how hard it is trying. The
  // laugh comes from the machinery — a simile, a personified machine, an
  // absurd escalation — and from the punch landing in the final sentence.
  // A rant with no device and no punch cannot be funny, however annoyed
  // it sounds; announced anger or announced humour scores it down.
  const devices = countDistinctPhrases(candidate.text, HUMOUR_DEVICES);
  const punch = countDistinctPhrases(finalSentenceOf(candidate.text), FINAL_CLAUSE_PUNCHES);
  let score = 0.1 + Math.min(devices, 4) * 0.16 + (punch > 0 ? 0.16 : 0);
  if (countDistinctPhrases(candidate.text, ANNOUNCED) > 0) score -= 0.25;
  return clamp01(score);
}

function scoreSpecific(candidate: Candidate): number {
  // Criterion 3: a specific, concrete annoyance rather than a vague mood.
  // Concrete nouns a reader can see, numbers and quoted phrases a reader
  // can check, and a named subject rather than a feeling.
  // Multi-word nouns ("test page", "bagging area", "sticky note") are
  // matched as phrases: word matching silently missed every one of them.
  const concrete = countDistinctPhrases(candidate.text, CONCRETE_NOUNS);
  let score = Math.min(concrete, 6) * 0.1;
  if (countDistinctWords(candidate.text, SPECIFIC_DETAIL) >= 1) score += 0.15;
  if (countDistinctPhrases(candidate.text, QUOTED_PHRASES) >= 1) score += 0.15;
  if (countDistinctPhrases(candidate.text, ANNOYANCE_SUBJECTS) >= 2) score += 0.1;
  return clamp01(score);
}

function scoreSharp(candidate: Candidate): number {
  // Criterion 4: sharp, economical wording, every sentence earning its
  // place and no throat-clearing. The sweet spot is 180 to 320 characters:
  // long enough for a setup and a punch, short enough that nothing drags.
  // The payoff sits in a short final sentence, and the last word lands.
  const len = candidate.text.length;
  let score = 0;
  if (len >= 180 && len <= 320) score += 0.4;
  else if (len >= 140 && len <= MAX_CHARS) score += 0.25;
  else score += 0.1;
  if (finalSentenceWordCount(candidate.text) <= 16) score += 0.3;
  if (STRONG_FINALS.includes(lastWordOf(candidate.text))) score += 0.3;
  if (countDistinctPhrases(candidate.text, THROAT_CLEARING) > 0) score -= 0.3;
  const sentences = sentenceCount(candidate.text);
  if (sentences < 1 || sentences > 4) score -= 0.2;
  return clamp01(score);
}

function scoreFresh(candidate: Candidate): number {
  // Criterion 5: an angle on the annoyance not heard a hundred times.
  // Starts clean; every cliche costs a third.
  let score = 1.0;
  score -= countDistinctPhrases(candidate.text, CLICHES) * 0.35;
  return clamp01(score);
}

function scoreCandidate(candidate: Candidate): Score {
  const onSubject = scoreOnSubject(candidate);
  const funny = scoreFunny(candidate);
  const specific = scoreSpecific(candidate);
  const sharp = scoreSharp(candidate);
  const fresh = scoreFresh(candidate);
  const total =
    onSubject * WEIGHTS.onSubject +
    funny * WEIGHTS.funny +
    specific * WEIGHTS.specific +
    sharp * WEIGHTS.sharp +
    fresh * WEIGHTS.fresh;
  return { onSubject, funny, specific, sharp, fresh, total };
}

// ---------------------------------------------------------------------------
// Ranking and the gate.
// ---------------------------------------------------------------------------

interface Ranked {
  candidate: Candidate;
  score: Score;
  index: number;
}

function rankCandidates(): Ranked[] {
  const ranked: Ranked[] = CANDIDATES.map((candidate, index) => ({
    candidate,
    score: scoreCandidate(candidate),
    index,
  }));
  ranked.sort((a, b) => {
    if (b.score.total !== a.score.total) return b.score.total - a.score.total;
    if (a.candidate.text.length !== b.candidate.text.length) {
      return a.candidate.text.length - b.candidate.text.length;
    }
    return a.index - b.index; // earliest candidate wins a full tie
  });
  return ranked;
}

function gateCheck(text: string): string[] {
  const problems: string[] = [];
  if (text.length < MIN_CHARS || text.length > MAX_CHARS) {
    problems.push(`length ${text.length} outside ${MIN_CHARS}-${MAX_CHARS}`);
  }
  if (text.trim().length === 0) problems.push("only whitespace");
  if (text !== text.trim()) problems.push("leading or trailing whitespace");
  if (text.includes("\n") || text.includes("\r")) problems.push("more than one line");
  return problems;
}

// ---------------------------------------------------------------------------
// Main: rank, gate, write, read back and verify byte-for-byte.
// ---------------------------------------------------------------------------

function main(): void {
  const ranked = rankCandidates();
  const winner = ranked[0];

  console.log("Angry Judge: The Short Rant Contest — candidate ranking (judge order weights)");
  console.log("--------------------------------------------------------------------------------");
  for (const entry of ranked) {
    const s = entry.score;
    console.log(
      `${entry.candidate.id.padEnd(18)} total=${s.total.toFixed(3)} ` +
        `subj=${s.onSubject.toFixed(2)} funny=${s.funny.toFixed(2)} ` +
        `spec=${s.specific.toFixed(2)} sharp=${s.sharp.toFixed(2)} ` +
        `fresh=${s.fresh.toFixed(2)} len=${entry.candidate.text.length}`,
    );
  }
  console.log("--------------------------------------------------------------------------------");
  console.log(`Winner: ${winner.candidate.id} (${winner.candidate.text.length} chars)`);
  console.log(`> ${winner.candidate.text}`);

  const problems = gateCheck(winner.candidate.text);
  if (problems.length > 0) {
    throw new Error(`gate failed for winner ${winner.candidate.id}: ${problems.join("; ")}`);
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(OUTPUT_FILE, winner.candidate.text, "utf8");

  // Read back and verify byte-for-byte: what the judge reads is what we
  // scored, with no trailing newline and no extra whitespace.
  const readBack = readFileSync(OUTPUT_FILE, "utf8");
  if (readBack !== winner.candidate.text) {
    throw new Error("read-back mismatch: entry.txt differs from the winning rant");
  }
  const gateAgain = gateCheck(readBack);
  if (gateAgain.length > 0) {
    throw new Error(`gate failed on read-back: ${gateAgain.join("; ")}`);
  }
  console.log(`Wrote ${OUTPUT_FILE} (${readBack.length} characters, no trailing newline)`);
}

main();
