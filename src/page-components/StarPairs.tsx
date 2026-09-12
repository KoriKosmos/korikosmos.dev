import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import {
  BEST_KEY, DIFFICULTIES, SIGNS, concealPairCards, createPairGame, flipPairCard,
  isBetterScore, parsePersonalBests, type Difficulty, type PairGame, type PersonalBests,
} from '../lib/starPairs';

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export function StarPairs() {
  const [difficulty, setDifficulty] = useState<Difficulty>('orbit');
  const [game, setGame] = useState<PairGame | null>(null);
  const [roundId, setRoundId] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const [focused, setFocused] = useState(0);
  const [message, setMessage] = useState('Find the matching constellations. Take your time.');
  const [bests, setBests] = useState<PersonalBests>({});
  const buttons = useRef(new Map<number, HTMLButtonElement>());

  useEffect(() => {
    try { setBests(parsePersonalBests(localStorage.getItem(BEST_KEY))); } catch { /* Storage is optional. */ }
  }, []);

  useEffect(() => {
    if (!game || game.won || paused) return;
    const interval = window.setInterval(() => setSeconds(value => value + 1), 1000);
    const onVisibility = () => { if (document.hidden) setPaused(true); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [roundId, Boolean(game), game?.won, paused]);

  useEffect(() => {
    if (!game || game.flipped.length !== 2 || paused) return;
    const timeout = window.setTimeout(() => setGame(current => current ? concealPairCards(current) : current), 1000);
    return () => window.clearTimeout(timeout);
  }, [game, paused]);

  useEffect(() => {
    if (!game?.won) return;
    const score = { moves: game.moves, seconds };
    setBests(previous => {
      if (!isBetterScore(score, previous[game.difficulty])) return previous;
      const next = { ...previous, [game.difficulty]: score };
      try { localStorage.setItem(BEST_KEY, JSON.stringify(next)); } catch { /* Play still works without storage. */ }
      return next;
    });
  }, [game?.won]);

  function start() {
    setRoundId(value => value + 1);
    setSeconds(0);
    setPaused(false);
    setFocused(0);
    setGame(createPairGame(difficulty));
    setMessage('A new sky is ready. Reveal two cards to find a pair.');
  }

  function flip(id: number) {
    if (!game || paused) return;
    const next = flipPairCard(game, id);
    if (next === game) return;
    const name = SIGNS[next.cards[id].sign].name;
    setGame(next);
    if (next.won) setMessage(`Sky complete! All ${DIFFICULTIES[difficulty].pairs} pairs found in ${next.moves} moves.`);
    else if (next.matched.length > game.matched.length) setMessage(`${name} matched! ${next.matched.length / 2} pairs found.`);
    else if (next.flipped.length === 2) setMessage(`${SIGNS[next.cards[next.flipped[0]].sign].name} and ${name}. Try another pair.`);
    else setMessage(`${name} revealed. Choose another card.`);
  }

  function moveFocus(event: KeyboardEvent<HTMLButtonElement>, id: number) {
    if (!game) return;
    const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -4, ArrowDown: 4 };
    let next: number;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = game.cards.length - 1;
    else if (event.key in offsets) next = (id + offsets[event.key] + game.cards.length) % game.cards.length;
    else return;
    event.preventDefault();
    setFocused(next);
    buttons.current.get(next)?.focus();
  }

  const best = bests[difficulty];
  return (
    <section className="star-pairs py-8 space-y-6" aria-labelledby="star-pairs-title">
      <header className="space-y-3">
        <p className="text-primary font-semibold text-sm uppercase tracking-widest">A little cosmic brain break</p>
        <h1 id="star-pairs-title" className="text-4xl font-black">Star Pairs</h1>
        <p className="text-base-content/70">Turn over two cards. Remember the patterns. Bring the whole sky together.</p>
      </header>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex-1 min-w-40">
          <span className="block text-sm font-semibold mb-2">Your patch of sky</span>
          <select
            className="select select-bordered bg-base-200 w-full"
            value={difficulty}
            onChange={event => {
              setDifficulty(event.target.value as Difficulty);
              setGame(null);
              setSeconds(0);
              setPaused(false);
              setMessage('Choose Start game when you are ready.');
            }}
          >
            {Object.entries(DIFFICULTIES).map(([value, option]) => <option key={value} value={value}>{option.label} · {option.pairs} pairs</option>)}
          </select>
        </label>
        <button type="button" className="btn btn-primary" onClick={start}>{game ? 'New game' : 'Start game'}</button>
        {game && !game.won && <button type="button" className="btn btn-outline" onClick={() => setPaused(value => !value)}>{paused ? 'Resume' : 'Pause'}</button>}
      </div>

      <dl className="grid grid-cols-3 gap-3 text-center">
        {[['Pairs', `${(game?.matched.length ?? 0) / 2} / ${DIFFICULTIES[difficulty].pairs}`], ['Moves', String(game?.moves ?? 0)], ['Time', clock(seconds)]].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-base-content/10 bg-base-200/70 p-3">
            <dt className="text-xs uppercase tracking-wider text-base-content/70">{label}</dt>
            <dd className="text-xl font-bold tabular-nums mt-1">{value}</dd>
          </div>
        ))}
      </dl>

      <p role="status" className="min-h-6 text-sm font-medium">{paused ? 'Paused. Your cards are hidden and the clock has stopped.' : message}</p>

      {!game ? (
        <div className="rounded-2xl border border-dashed border-primary/40 bg-base-200/40 p-10 text-center">
          <span className="text-5xl text-primary" aria-hidden="true">✧</span>
          <p className="mt-4 font-semibold">A fresh constellation with every game.</p>
          <p className="text-sm text-base-content/70 mt-2">Start with Orbit, then explore a bigger sky.</p>
        </div>
      ) : (
        <div role="group" aria-label="Star Pairs board" aria-describedby="star-pairs-controls" className="grid grid-cols-4 gap-2 sm:gap-3">
          {game.cards.map(card => {
            const matched = game.matched.includes(card.id);
            const revealed = !paused && (matched || game.flipped.includes(card.id));
            const sign = SIGNS[card.sign];
            return (
              <button
                key={card.id}
                ref={element => { if (element) buttons.current.set(card.id, element); else buttons.current.delete(card.id); }}
                type="button"
                tabIndex={focused === card.id ? 0 : -1}
                aria-label={`Card ${card.id + 1}, ${revealed ? `${sign.name}, ${matched ? 'matched' : 'revealed'}` : 'face down'}`}
                aria-disabled={paused || matched || game.flipped.includes(card.id) || game.flipped.length === 2}
                data-revealed={revealed}
                data-matched={matched}
                className={`star-pairs-card aspect-square rounded-xl border-2 p-1 sm:p-2 flex flex-col items-center justify-center motion-safe:transition-colors ${revealed ? 'border-primary/60 bg-primary/10 text-base-content' : 'border-base-content/10 bg-base-200 text-primary hover:border-primary/50'}`}
                onFocus={() => setFocused(card.id)}
                onKeyDown={event => moveFocus(event, card.id)}
                onClick={() => flip(card.id)}
              >
                {revealed ? (
                  <>
                    <svg viewBox="0 0 100 100" className="w-3/4 h-3/4 text-primary" aria-hidden="true">
                      <polyline points={sign.points.map(point => point.join(',')).join(' ')} fill="none" stroke="currentColor" strokeWidth="2" opacity="0.65" />
                      {sign.points.map(([x, y], index) => <circle key={index} cx={x} cy={y} r="3.5" fill="currentColor" />)}
                    </svg>
                    <span className="text-[10px] sm:text-xs font-semibold">{matched ? '✓ ' : ''}{sign.name}</span>
                  </>
                ) : <span className="text-3xl sm:text-5xl" aria-hidden="true">✧</span>}
              </button>
            );
          })}
        </div>
      )}

      {game?.won && <div className="rounded-xl bg-primary/10 border border-primary/30 p-5 text-center"><p className="text-xl font-bold">Constellation complete ✨</p><p className="mt-2">{game.moves} moves in {clock(seconds)}. Fancy another sky?</p></div>}
      <footer className="text-sm text-base-content/70 space-y-2">
        <p id="star-pairs-controls">Tap a card, or use the arrow keys and Enter or Space. Leaving this tab pauses the game.</p>
        <p>{best ? `Your best ${DIFFICULTIES[difficulty].label}: ${best.moves} moves in ${clock(best.seconds)}.` : `Complete ${DIFFICULTIES[difficulty].label} to set your first personal best.`} Bests stay on this device, with fewer moves ranked first.</p>
      </footer>
    </section>
  );
}

export default StarPairs;
