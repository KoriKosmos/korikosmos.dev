import { useEffect } from "react";
import { initRockPaperScissors } from "../lib/rockPaperScissors";

export function RockPaperScissors() {
  useEffect(() => {
    initRockPaperScissors();
  }, []);

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
        <button id="resetScores" className="px-4 py-2 bg-neutral text-neutral-content rounded">
          Reset Scores
        </button>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Global Leaderboard</h2>
        <ol id="leaderboard" className="list-decimal ml-6 space-y-1"></ol>
      </div>
    </>
  );
}
