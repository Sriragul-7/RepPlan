import type { Exercise } from "./types";

const TYPO_FIXES: Record<string, string> = {
  dumbel: "dumbbell",
  dumble: "dumbbell",
  dumbell: "dumbbell",
  dumbbel: "dumbbell",
  dumbles: "dumbbell",
  dumbals: "dumbbell",
  dumball: "dumbbell",
  icline: "incline",
  inclin: "incline",
  iclined: "incline",
  barbel: "barbell",
  barbal: "barbell",
  pres: "press",
  squat: "squat",
  deadlift: "deadlift",
  deandlift: "deadlift",
  biceps: "biceps",
  bicep: "biceps",
  tricep: "triceps",
  triceps: "triceps",
  sholders: "shoulders",
  sholder: "shoulder",
  shoulders: "shoulders",
  shoulder: "shoulders",
  pecs: "chest",
  calf: "calves",
  hams: "hamstrings",
  hamstrings: "hamstrings",
  hamstring: "hamstrings",
  delts: "delts",
  quad: "quads",
  quads: "quads",
};

export function normalizeExerciseText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizeExerciseText(text: string): string[] {
  const normalized = normalizeExerciseText(text);
  return normalized ? normalized.split(" ") : [];
}

function fixToken(token: string): string {
  return TYPO_FIXES[token] ?? token;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const prev = new Array<number>(n + 1);
  const curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

function tokenMatches(token: string, candidate: string): boolean {
  if (token === candidate) return true;
  // Prefix match for reasonably long tokens ("incline" finds "inclined").
  if (token.length >= 4 && candidate.startsWith(token)) return true;
  if (candidate.length >= 4 && candidate.startsWith(token)) return true;
  // One typo tolerated on medium-length tokens ("dumbel" -> "dumbbell").
  if (token.length >= 5 && levenshtein(token, candidate) <= 1) return true;
  return false;
}

type ScoredExercise = { exercise: Exercise; score: number; matchedAll: boolean; nameHits: number };

export function searchExercises(exercises: Exercise[], rawQuery: string): Exercise[] {
  const trimmed = rawQuery.trim();
  if (!trimmed) return exercises;

  const queryTokens = tokenizeExerciseText(trimmed).map(fixToken).filter(Boolean);

  const scored: ScoredExercise[] = [];

  for (const exercise of exercises) {
    const name = exercise.name ?? "";
    const nameTokens = tokenizeExerciseText(name);
    const nameText = nameTokens.join(" ");
    const metaTokens = tokenizeExerciseText(
      `${exercise.body_part ?? ""} ${exercise.target_muscle ?? ""} ${exercise.equipment ?? ""}`,
    );

    let matchedAll = true;
    let nameHits = 0;
    let metaHits = 0;

    for (const token of queryTokens) {
      const hitName = nameTokens.some((candidate) => tokenMatches(token, candidate));
      const hitMeta = !hitName && metaTokens.some((candidate) => tokenMatches(token, candidate));
      if (!hitName && !hitMeta && token.length >= 3 && nameText.includes(token)) {
        nameHits += 1;
        continue;
      }
      if (!hitName && !hitMeta) {
        matchedAll = false;
        break;
      }
      if (hitName) nameHits += 1;
      else metaHits += 1;
    }

    if (!matchedAll) continue;

    const popularity = exercise.popularity ?? 0;
    const score = popularity + nameHits * 8 + metaHits * 2;
    scored.push({ exercise, score, matchedAll, nameHits });
  }

  scored.sort((a, b) => {
    if (b.nameHits !== a.nameHits) return b.nameHits - a.nameHits;
    return b.score - a.score;
  });

  return scored.map((s) => s.exercise);
}