import { useEffect, useState } from "react";
import { initRockPaperScissors, type RoundOutcome } from "../lib/rockPaperScissors";
import { otherDialogOpen, watchGamepads, type PadButton } from "../lib/gamepad";
import { haptic, trackInputSource, type HapticKind } from "../lib/haptics";
import { HapticsToggle } from "./HapticsToggle";
import { RpsDailyDuel } from "./RpsDailyDuel";

const OUTCOME_HAPTIC: Record<RoundOutcome, HapticKind> = { win: "match", lose: "miss", tie: "tap" };

/**
 * Controller throws, laid out the way the buttons sit on screen: the left,
 * top, and right of either the face buttons or the d-pad/stick.
 */
const PAD_THROWS: [PadButton[], string][] = [
  [["x", "left"], "rock"],
  [["y", "up"], "paper"],
  [["b", "right"], "scissors"],
];

export function RockPaperScissors() {
  const [padConnected, setPadConnected] = useState(false);

  useEffect(() => {
    const stopTracking = trackInputSource();
    initRockPaperScissors({ onResult: (outcome) => haptic(OUTCOME_HAPTIC[outcome]) });
    return stopTracking;
  }, []);

  // A press clicks the matching on-screen button, so the game logic in
  // rockPaperScissors.ts stays the single path for every throw.
  useEffect(() => watchGamepads((frame) => {
    if (!frame.pressed.size || otherDialogOpen()) return;
    const hit = PAD_THROWS.find(([buttons]) => buttons.some((b) => frame.pressed.has(b)));
    if (hit) document.querySelector<HTMLButtonElement>(`.throw[data-throw="${hit[1]}"]`)?.click();
  }, setPadConnected), []);

  return (
    <>
      <h1 className="text-3xl font-bold my-6">Rock Paper Scissors</h1>
      <div className="space-y-4">
        <div className="flex gap-4">
          <button className="throw px-4 py-2 bg-neutral text-neutral-content rounded" data-throw="rock">
            Rock
          </button>
          <button className="throw px-4 py-2 bg-neutral text-neutral-content rounded" data-throw="paper">
            Paper
          </button>
          <button className="throw px-4 py-2 bg-neutral text-neutral-content rounded" data-throw="scissors">
            Scissors
          </button>
        </div>
        {padConnected && (
          <p className="text-sm opacity-70">
            Controller: X or ◀ for rock, Y or ▲ for paper, B or ▶ for scissors.
          </p>
        )}
        <p id="computerChoice"></p>
        <p id="result"></p>
        <div className="space-y-1">
          <p>
            Player Wins: <span id="playerWins">0</span>
          </p>
          <p>
            CPU Wins: <span id="cpuWins">0</span>
          </p>
          <p>
            Ties: <span id="ties">0</span>
          </p>
          <p className="font-bold">
            Net Score: <span id="netScore">0</span>
          </p>
          <p>
            High Score (Net): <span id="highscore">0</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button id="resetScores" className="px-4 py-2 bg-neutral text-neutral-content rounded">
            Reset Scores
          </button>
          <HapticsToggle padConnected={padConnected} />
        </div>
      </div>

      <RpsDailyDuel />

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Global Leaderboard</h2>
        <ol id="leaderboard" className="list-decimal ml-6 space-y-1"></ol>
      </div>
    </>
  );
}
