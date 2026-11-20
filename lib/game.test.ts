import { describe, expect, it } from "vitest";
import {
  applyStrike,
  currentStriker,
  drawFromUrn,
  dropFromOrder,
  isValidCode,
  makeCode,
  manualKey,
  mergePicks,
  normalizeCode,
  tallyVotes,
  weightedPick,
  type Rng,
} from "./game";
import { plural } from "./ru";
import type { BoardFilm, Film, StrikePlay } from "./types";

const film = (key: string): Film => ({ key, title: key });
const board = (...keys: [string, number][]): BoardFilm[] => keys.map(([key, weight]) => ({ ...film(key), weight }));
const fixed = (...values: number[]): Rng => {
  let i = 0;
  return (n) => values[i++ % values.length] % n;
};

describe("room codes", () => {
  it("generates valid 4-char codes and normalizes input", () => {
    const code = makeCode((n) => Math.floor(Math.random() * n));
    expect(isValidCode(code)).toBe(true);
    expect(normalizeCode(" k7-qm9 ")).toBe("K7QM");
    expect(isValidCode("K0QM")).toBe(false); // 0 is excluded from the alphabet
  });
});

describe("mergePicks", () => {
  it("collapses duplicates into weight and remembers every author", () => {
    const { board: b, authors } = mergePicks(
      [
        { playerId: "a", films: [film("movie:1"), film("movie:2")] },
        { playerId: "b", films: [film("movie:2"), film("tv:3")] },
      ],
      fixed(0),
    );
    expect(b).toHaveLength(3);
    expect(b.find((f) => f.key === "movie:2")?.weight).toBe(2);
    expect(authors["movie:2"]).toEqual(["a", "b"]);
    expect(authors["tv:3"]).toEqual(["b"]);
  });

  it("does not double-count the same player", () => {
    const { board: b } = mergePicks([{ playerId: "a", films: [film("x"), film("x")] }], fixed(0));
    expect(b[0].weight).toBe(1);
  });

  it("treats manual titles case- and ё-insensitively", () => {
    expect(manualKey("Ёлки  2!")).toBe(manualKey("елки 2"));
  });
});

describe("urn", () => {
  it("respects weights", () => {
    const items = board(["a", 1], ["b", 3]);
    expect(weightedPick(items, () => 0)?.key).toBe("a");
    expect(weightedPick(items, () => 1)?.key).toBe("b");
    expect(weightedPick(items, () => 3)?.key).toBe("b");
  });

  it("never draws an excluded film and runs dry", () => {
    const b = board(["a", 1], ["b", 1]);
    for (let i = 0; i < 20; i++) expect(drawFromUrn(b, ["a"], (n) => i % n)).toBe("b");
    expect(drawFromUrn(b, ["a", "b"], () => 0)).toBeNull();
  });
});

describe("votes", () => {
  it("picks the most approved film", () => {
    const r = tallyVotes(board(["a", 1], ["b", 1], ["c", 1]), [["a", "b"], ["b"], ["b", "c"]], fixed(0));
    expect(r.key).toBe("b");
    expect(r.tally).toEqual({ a: 1, b: 3, c: 1 });
    expect(r.tied).toEqual([]);
  });

  it("breaks ties with the urn and reports them", () => {
    const r = tallyVotes(board(["a", 1], ["b", 1]), [["a"], ["b"], ["a", "b", "b"]], fixed(1));
    expect(r.tied).toEqual(["a", "b"]);
    expect(r.key).toBe("b");
  });

  it("ignores keys that are not on the board", () => {
    const r = tallyVotes(board(["a", 1]), [["zzz"]], fixed(0));
    expect(r.tally).toEqual({ a: 0 });
  });
});

describe("strike", () => {
  const b = board(["a", 1], ["b", 1], ["c", 1]);
  const start: StrikePlay = { kind: "strike", order: ["p1", "p2"], turn: 0, struck: [] };

  it("rotates turns and declares the last film the winner", () => {
    const one = applyStrike(b, start, "a", "p1");
    expect(one.winner).toBeNull();
    expect(currentStriker(one.play)).toBe("p2");
    const two = applyStrike(b, one.play, "c", "p2");
    expect(two.winner).toBe("b");
  });

  it("keeps the right player on turn when someone leaves", () => {
    const play: StrikePlay = { ...start, order: ["p1", "p2", "p3"], turn: 2 };
    expect(currentStriker(dropFromOrder(play, "p1"))).toBe("p3");
    expect(currentStriker(dropFromOrder(play, "p3"))).toBe("p1");
    const mid: StrikePlay = { ...start, order: ["p1", "p2", "p3"], turn: 1 };
    expect(currentStriker(dropFromOrder(mid, "p2"))).toBe("p3");
  });
});

describe("plural", () => {
  it("handles Russian forms", () => {
    const f: [string, string, string] = ["фильм", "фильма", "фильмов"];
    expect([1, 2, 5, 11, 21, 22, 25, 112].map((n) => plural(n, f))).toEqual([
      "фильм",
      "фильма",
      "фильмов",
      "фильмов",
      "фильм",
      "фильма",
      "фильмов",
      "фильмов",
    ]);
  });
});
