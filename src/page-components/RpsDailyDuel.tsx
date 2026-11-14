import { useEffect, useState } from "react";
import { dailyKey, readDaily, writeDaily } from "../lib/daily";
import { haptic, type HapticKind } from "../lib/haptics";
import {
  DUEL_KEY, DUEL_ROUNDS, THROWS, duelThrows, judge, parseDuel, tally, type DuelOutcome, type Throw,
} from "../lib/rpsDuel";

const LABEL: Record<Throw, string> = { rock: "Rock", paper: "Paper", scissors: "Scissors" };
const OUTCOME_TEXT: Record<DuelOutcome, string> = { win: "You win the round!", lose: "They take the round.", tie: "A tie." };
const OUTCOME_HAPTIC: Record<DuelOutcome, HapticKind> = { win: "match", lose: "miss", tie: "tap" };

/**
 * The daily duel sits beside the endless game rather than inside it: its
 * buttons deliberately don't use the `.throw` class, so rockPaperScissors.ts
 * and the controller mapping never see them. One attempt per day, saved after
 * every round so a reload can't buy a second go.
 */
export function RpsDailyDuel() {
  const [day, setDay] = useState<string | null>(null);
  const [throws, setThrows] = useState<Throw[]>([]);

  // Client-only: the server doesn't know the visitor's progress, and the day
  // must come from the browser's clock at play time.
  useEffect(() => {
    const today = dailyKey();
    setDay(today);
    setThrows(parseDuel(readDaily(DUEL_KEY, today)));
  }, []);

  if (!day) return null;
  const cpu = duelThrows(day);
  const done = throws.length >= DUEL_ROUNDS;
  const score = tally(throws, cpu);
  const last = throws.length ? throws.length - 1 : -1;

  const play = (t: Throw) => {
    if (done) return;
    const next = [...throws, t];
    setThrows(next);
    writeDaily(DUEL_KEY, { throws: next }, day);
    if (next.length < DUEL_ROUNDS) {
      haptic(OUTCOME_HAPTIC[judge(t, cpu[next.length - 1])]);
    } else {
      const final = tally(next, cpu);
      haptic(final.win > final.lose ? "win" : "over");
    }
  };

  return (
    <section className="mt-8 space-y-3" aria-labelledby="rps-duel-title">
      <h2 id="rps-duel-title" className="text-xl font-bold">Daily duel</h2>
      <p className="text-sm opacity-80">
        Ten rounds against today&apos;s opponent, the same one for everyone until midnight UTC. It has a habit. Can you spot it? One go per day.
      </p>
      {!done && (
        <div className="flex flex-wrap gap-4" role="group" aria-label={`Round ${throws.length + 1} of ${DUEL_ROUNDS}`}>
          {THROWS.map((t) => (
            <button key={t} type="button" className="rps-duel-throw px-4 py-2 bg-neutral text-neutral-content rounded" onClick={() => play(t)}>
              {LABEL[t]}
            </button>
          ))}
        </div>
      )}
      <p aria-live="polite">
        {last >= 0
          ? `Round ${last + 1}: you threw ${throws[last]}, they threw ${cpu[last]}. ${OUTCOME_TEXT[judge(throws[last], cpu[last])]}`
          : `Round 1 of ${DUEL_ROUNDS}. Make your first throw.`}
      </p>
      <p className="font-bold">
        {done ? "Final: " : `After ${throws.length} of ${DUEL_ROUNDS}: `}
        {score.win} won, {score.lose} lost, {score.tie} tied
      </p>
      {done && (
        <p className="text-sm opacity-80">
          {score.win > score.lose ? "You read them well." : score.win === score.lose ? "Dead even." : "They got the better of you today."}{" "}
          Their throws were {cpu.join(", ")}. A new opponent arrives tomorrow.
        </p>
      )}
    </section>
  );
}

export default RpsDailyDuel;
