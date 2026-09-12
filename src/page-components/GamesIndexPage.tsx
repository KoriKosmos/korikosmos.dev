export function GamesIndexPage() {
  return (
    <>
      <h1 className="text-3xl font-bold my-6">Games</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <a href="/games/star-pairs/" className="block p-6 rounded-xl bg-gradient-to-br from-primary to-secondary shadow-lg motion-safe:hover:scale-105 transition-transform text-primary-content">
          <p className="text-xs uppercase font-bold tracking-widest mb-3">New in the arcade</p>
          <h2 className="text-2xl font-bold mb-2">Star Pairs</h2>
          <p className="opacity-90">Match the constellations in a cosmic memory game.</p>
          <p className="text-sm mt-4 opacity-80">Three board sizes · Keyboard and touch · Personal bests</p>
        </a>
        <a
          href="/games/tetris/"
          className="block p-6 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg hover:scale-105 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-white transition-transform text-white"
        >
          <h2 className="text-2xl font-bold mb-2">Tetris</h2>
          <p className="opacity-90">The classic block-stacking puzzle game.</p>
        </a>

        <a
          href="/games/rock-paper-scissors/"
          className="block p-6 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg hover:scale-105 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-white transition-transform text-white"
        >
          <h2 className="text-2xl font-bold mb-2">Rock Paper Scissors</h2>
          <p className="opacity-90">Challenge the CPU in this timeless hand game.</p>
        </a>
      </div>
    </>
  );
}
