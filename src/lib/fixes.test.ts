import { describe, expect, it } from "vitest";
import type { MatchSet, Pair } from "../types";
import { splitBulkLine } from "./bulk";
import { compileMatch } from "./compile";
import { chunk, locatePhrase, remapAfterEdit, samePhrase, tokenise, words } from "./mixgap";
import { buildChoices, interchangeable, sameSide } from "./quiz";
import { normaliseForGrid } from "./wordsearch";

const pair = (id: string, left: string, right: string): Pair => ({
  id,
  left: { kind: "text", text: left },
  right: { kind: "text", text: right },
});

describe("chunk for the tile puzzles", () => {
  it("gives exactly the tiles each board needs at every passage length", () => {
    for (const [tiles, min] of [[8, 8], [15, 15], [24, 24]] as const) {
      for (let n = min; n <= 500; n++) {
        const text = Array.from({ length: n }, (_, i) => `w${i}`).join(" ");
        const chunks = chunk(text, tiles);
        expect(chunks, `${n} words into ${tiles}`).toHaveLength(tiles);
        expect(chunks.every((c) => c.length > 0)).toBe(true);
        expect(chunks.join(" ")).toBe(text);
      }
    }
  });
});

describe("buildChoices", () => {
  const verbs = [
    pair("1", "je (parler)", "parle"),
    pair("2", "il (parler)", "parle"),
    pair("3", "nous (parler)", "parlons"),
    pair("4", "vous (parler)", "parlez"),
    pair("5", "tu (parler)", "parles"),
    pair("6", "elle (parler)", "Parle "),
  ];

  it("never offers a second copy of the right answer, or two identical options", () => {
    for (let run = 0; run < 200; run++) {
      for (const correct of verbs) {
        const texts = buildChoices(verbs, correct, 4).map((c) =>
          c.side.kind === "text" ? c.side.text.trim().toLowerCase() : "",
        );
        expect(new Set(texts).size).toBe(texts.length);
      }
    }
  });

  it("treats pairs sharing an answer or a prompt as interchangeable", () => {
    expect(interchangeable(verbs[0], verbs[1])).toBe(true);
    expect(interchangeable(verbs[0], verbs[5])).toBe(true);
    expect(interchangeable(verbs[0], verbs[2])).toBe(false);
    expect(interchangeable(pair("a", "bank", "banque"), pair("b", "bank", "rive"))).toBe(true);
    expect(sameSide({ kind: "text", text: "x" }, { kind: "image", mediaId: "x" })).toBe(false);
  });
});

describe("wordsearch letters", () => {
  it("spells out ligatures instead of dropping them", () => {
    expect(normaliseForGrid("sœur")).toBe("SOEUR");
    expect(normaliseForGrid("Œuf")).toBe("OEUF");
    expect(normaliseForGrid("Straße")).toBe("STRASSE");
    expect(normaliseForGrid("niño")).toBe("NINO");
  });
});

describe("remapAfterEdit", () => {
  const text = "Je me lève à sept heures. Je mange.";
  const wordAt = (t: string, i: number) => words(t)[i];
  const gaps = [{ wordIndex: 2 }, { wordIndex: 4 }, { wordIndex: 7 }]; // lève, sept, mange
  const span = (t: string, phrase: string) => {
    const start = t.indexOf(phrase);
    return { id: phrase, start, end: start + phrase.length };
  };
  const findIt = [span(text, "sept heures"), span(text, "Je mange")];

  it("moves gaps and spans along when words are added earlier", () => {
    const next = "Le matin, je me lève à sept heures. Je mange.";
    const out = remapAfterEdit(text, next, gaps, findIt);
    expect(out.gaps.map((g) => wordAt(next, g.wordIndex))).toEqual(["lève", "sept", "mange"]);
    expect(out.findIt.map((f) => next.slice(f.start, f.end))).toEqual(["sept heures", "Je mange"]);
  });

  it("drops only what the edit changed", () => {
    const next = "Je me lève à huit heures. Je mange.";
    const out = remapAfterEdit(text, next, gaps, findIt);
    expect(out.gaps.map((g) => wordAt(next, g.wordIndex))).toEqual(["lève", "mange"]);
    expect(out.findIt.map((f) => next.slice(f.start, f.end))).toEqual(["Je mange"]);
  });

  it("drops a gap when letters are typed onto its word", () => {
    const next = text.replace("mange.", "mangeons.");
    const out = remapAfterEdit(text, next, gaps, findIt);
    expect(out.gaps.map((g) => wordAt(next, g.wordIndex))).toEqual(["lève", "sept"]);
  });

  it("survives typing a passage one character at a time", () => {
    let current = "";
    let state = { gaps: [] as { wordIndex: number }[], findIt: [] as typeof findIt };
    for (const ch of text) {
      state = remapAfterEdit(current, current + ch, state.gaps, state.findIt);
      current += ch;
    }
    state = remapAfterEdit(current, current, gaps, findIt);
    expect(state.gaps).toEqual(gaps);
    expect(tokenise(current).length).toBeGreaterThan(0);
  });
});

describe("Find it! phrases", () => {
  const passage = "Je me lève.\nJe mange du pain.";
  it("locates a phrase selected across a line break", () => {
    const found = locatePhrase(passage, "lève. Je mange");
    expect(found && passage.slice(found.start, found.end)).toBe("lève.\nJe mange");
    expect(locatePhrase(passage, "pas ici")).toBeNull();
    expect(locatePhrase("ça coûte 3.50 (environ)", "3.50 (environ)")).not.toBeNull();
  });
  it("compares ignoring how whitespace was reported", () => {
    expect(samePhrase(" lève. Je mange ", "lève.\nJe mange")).toBe(true);
    expect(samePhrase("lève", "mange")).toBe(false);
  });
});

describe("bulk add lines", () => {
  it("prefers tab, then dash, then comma, and keeps the rest of the answer", () => {
    expect(splitBulkLine("bonjour - hello, good morning")).toEqual(["bonjour", "hello, good morning"]);
    expect(splitBulkLine("le chien, the dog")).toEqual(["le chien", "the dog"]);
    expect(splitBulkLine("manger, to eat, to consume")).toEqual(["manger", "to eat, to consume"]);
    expect(splitBulkLine("week-end\tweekend - Sat, Sun")).toEqual(["week-end", "weekend - Sat, Sun"]);
    expect(splitBulkLine("week-end, weekend")).toEqual(["week-end", "weekend"]);
    expect(splitBulkLine("no separator here")).toBeNull();
  });
});

describe("compileMatch", () => {
  it("leaves unfinished rows out of play", () => {
    const set = {
      kind: "match",
      pairs: [
        pair("1", "un", "one"),
        pair("2", "", ""),
        pair("3", "deux", "  "),
        { id: "4", left: { kind: "image", mediaId: "" }, right: { kind: "text", text: "x" } },
        { id: "5", left: { kind: "image", mediaId: "m" }, right: { kind: "text", text: "y" } },
      ],
    } as unknown as MatchSet;
    expect(compileMatch(set).map((p) => p.id)).toEqual(["1", "5"]);
  });
});
