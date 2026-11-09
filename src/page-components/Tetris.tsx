import { useCallback, useEffect, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from "react";
import { NEXT_COUNT, TetrisEngine, clearTitle, describeClear, type ClearResult, type GameStatus, type PieceType } from "../lib/tetris";
import {
  BOARD_H, BOARD_W, PREVIEW_SLOT_H, PREVIEW_W, drawBoard, drawPreview, setupCanvas,
} from "../lib/tetrisCanvas";
import { TOP_OUT_MS, TetrisEffects } from "../lib/tetrisEffects";

const BEST_KEY = "tetris_highscore";
const NAME_KEY = "tetris_username";
const MAX_NAME = 20;
/** Longest frame the engine will simulate; a stalled tab must not dump gravity. */
const MAX_FRAME_MS = 100;
const LEADERBOARD_REFRESH_MS = 60_000;

interface LeaderboardEntry { name: string; score: number }

interface Hud {
  status: GameStatus;
  score: number;
  lines: number;
  level: number;
  hold: PieceType | null;
  holdUsed: boolean;
  queue: PieceType[];
}

function readStorage(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch { /* private mode: the game still works, it just forgets */ }
}

function snapshot(game: TetrisEngine): Hud {
  return {
    status: game.status, score: game.score, lines: game.lines, level: game.level,
    hold: game.hold, holdUsed: game.holdUsed, queue: [...game.queue],
  };
}
function sameHud(a: Hud, b: Hud) {
  return a.status === b.status && a.score === b.score && a.lines === b.lines && a.level === b.level
    && a.hold === b.hold && a.holdUsed === b.holdUsed && a.queue.join() === b.queue.join();
}

function isEditable(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
}

/** Keyboard legend; the keys must match onKeyDown below. */
const KEY_LEGEND: [string[], string][] = [
  [["←", "→"], "Move (hold to slide)"],
  [["↓"], "Soft drop"],
  [["Space"], "Hard drop"],
  [["↑", "X"], "Rotate clockwise"],
  [["Z"], "Rotate anticlockwise"],
  [["C", "Shift"], "Hold piece"],
  [["P", "Esc"], "Pause / resume"],
];
/** Touch legend; the icons must match the pad buttons below. */
const TOUCH_LEGEND: [string, string][] = [
  ["◀ ▶", "Move (hold to slide)"],
  ["▼", "Soft drop (hold)"],
  ["⤓", "Hard drop"],
  ["⟳", "Rotate clockwise"],
  ["⟲", "Rotate anticlockwise"],
  ["Hold", "Hold piece"],
  ["Pause", "Pause / resume (button by the score)"],
];

type CalloutKind = "clear" | "tetris" | "tspin" | "perfect" | "combo" | "level" | "points";
interface Callout { id: number; text: string; kind: CalloutKind; color?: string }
/** Callouts on screen at once; older ones are dropped rather than queued. */
const MAX_CALLOUTS = 5;

/** The floating text for one clear: its name, combo, perfect clear, points. */
function calloutsFor(result: ClearResult, nextId: () => number): Callout[] {
  const out: Callout[] = [];
  const title = clearTitle(result);
  if (title) {
    const kind: CalloutKind = result.lines === 4 ? "tetris" : result.tSpin !== "none" ? "tspin" : "clear";
    out.push({ id: nextId(), text: result.lines === 4 && !result.backToBack && result.tSpin === "none" ? "TETRIS!" : title, kind });
  }
  if (result.combo > 0) {
    // The combo heats up from yellow towards red as it grows.
    const hue = Math.max(0, 52 - Math.min(result.combo, 8) * 6.5);
    out.push({ id: nextId(), text: `${result.combo} Combo!`, kind: "combo", color: `hsl(${hue} 100% 62%)` });
  }
  if (result.perfectClear) out.push({ id: nextId(), text: "Perfect Clear!", kind: "perfect" });
  if (result.points > 0) out.push({ id: nextId(), text: `+${result.points.toLocaleString()}`, kind: "points" });
  return out;
}

type PadAction = "left" | "right" | "soft" | "cw" | "ccw" | "hard" | "hold";

export function Tetris() {
  const gameRef = useRef<TetrisEngine | null>(null);
  const boardRef = useRef<HTMLCanvasElement>(null);
  const nextRef = useRef<HTMLCanvasElement>(null);
  const holdRef = useRef<HTMLCanvasElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [hud, setHud] = useState<Hud>({
    status: "ready", score: 0, lines: 0, level: 1, hold: null, holdUsed: false, queue: [],
  });
  const [best, setBest] = useState(0);
  const [username, setUsername] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [callouts, setCallouts] = useState<Callout[]>([]);
  const effectsRef = useRef<TetrisEffects | null>(null);
  const boardWrapRef = useRef<HTMLDivElement>(null);
  const overTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [final, setFinal] = useState<{ score: number; newBest: boolean } | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lbError, setLbError] = useState(false);

  // Latest values for callbacks that live inside the animation loop.
  const bestRef = useRef(0);
  const usernameRef = useRef<string | null>(null);
  useEffect(() => { bestRef.current = best; }, [best]);
  useEffect(() => { usernameRef.current = username; }, [username]);

  // ---- Leaderboard -------------------------------------------------------

  const loadLeaderboard = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/scores/tetris", { signal });
      if (!res.ok) throw new Error(String(res.status));
      setLeaderboard(await res.json());
      setLbError(false);
    } catch (error) {
      if ((error as Error).name !== "AbortError") setLbError(true);
    }
  }, []);

  const submitScore = useCallback(async (name: string, score: number) => {
    setSaveState("saving");
    try {
      const res = await fetch("/api/scores/tetris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, score }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setLeaderboard(await res.json());
      setLbError(false);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadLeaderboard(controller.signal);
    const id = setInterval(() => {
      if (document.visibilityState === "visible") loadLeaderboard(controller.signal);
    }, LEADERBOARD_REFRESH_MS);
    return () => { controller.abort(); clearInterval(id); };
  }, [loadLeaderboard]);

  // ---- Game over ---------------------------------------------------------

  const handleGameOver = useCallback((score: number) => {
    const newBest = score > bestRef.current;
    if (newBest) {
      setBest(score);
      writeStorage(BEST_KEY, String(score));
    }
    setSaveState("idle");
    setAnnouncement(`Game over. Final score ${score}.`);
    const name = usernameRef.current;
    // With a known name, save straight away; the server keeps each name's best.
    if (name && score > 0) submitScore(name, score);
    // Let the stack grey out before the dialog covers it.
    const delay = effectsRef.current?.reducedMotion ? 0 : TOP_OUT_MS;
    if (overTimerRef.current) clearTimeout(overTimerRef.current);
    overTimerRef.current = setTimeout(() => {
      overTimerRef.current = null;
      setFinal({ score, newBest });
      const dialog = dialogRef.current;
      if (dialog && !dialog.open) dialog.showModal();
    }, delay);
  }, [submitScore]);
  const gameOverRef = useRef(handleGameOver);
  useEffect(() => { gameOverRef.current = handleGameOver; }, [handleGameOver]);

  // ---- Mount: engine, canvases, loop, input ------------------------------

  useEffect(() => {
    const board = boardRef.current, next = nextRef.current, hold = holdRef.current;
    if (!board || !next || !hold) return;
    const boardCtx = setupCanvas(board, BOARD_W, BOARD_H);
    const nextCtx = setupCanvas(next, PREVIEW_W, PREVIEW_SLOT_H * NEXT_COUNT);
    const holdCtx = setupCanvas(hold, PREVIEW_W, PREVIEW_SLOT_H);
    if (!boardCtx || !nextCtx || !holdCtx) return;

    const storedBest = parseInt(readStorage(BEST_KEY) ?? "0", 10);
    setBest(Number.isFinite(storedBest) && storedBest > 0 ? storedBest : 0);
    setUsername(readStorage(NAME_KEY));

    const game = new TetrisEngine();
    gameRef.current = game;
    const effects = new TetrisEffects();
    effectsRef.current = effects;
    const motion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const syncMotion = () => { effects.reducedMotion = !!motion?.matches; };
    syncMotion();
    motion?.addEventListener?.("change", syncMotion);

    let frame = 0;
    let last: number | null = null;
    let prev = snapshot(game);
    let calloutId = 0;
    const nextId = () => ++calloutId;
    const wrap = boardWrapRef.current;

    const render = (time: number) => {
      drawBoard(boardCtx, game);
      effects.draw(boardCtx, time);
      drawPreview(nextCtx, game.queue.slice(0, NEXT_COUNT));
      drawPreview(holdCtx, [game.hold], game.holdUsed);
      if (wrap) {
        const [sx, sy] = effects.shakeOffset(time);
        wrap.style.transform = sx || sy ? `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px)` : "";
      }
    };

    const tick = (time: number) => {
      const dt = last === null ? 0 : Math.min(time - last, MAX_FRAME_MS);
      last = time;
      game.step(dt);

      const fresh: Callout[] = [];
      for (const event of game.takeEvents()) {
        effects.push(event, time);
        if (event.type === "clear") {
          fresh.push(...calloutsFor(event.result, nextId));
          const label = describeClear(event.result);
          if (label) setAnnouncement(`${label}, plus ${event.result.points}.`);
        } else if (event.type === "levelUp") {
          fresh.push({ id: nextId(), text: `Level ${event.level}`, kind: "level" });
        }
      }
      if (fresh.length) setCallouts(list => [...list, ...fresh].slice(-MAX_CALLOUTS));
      render(time);

      const now = snapshot(game);
      if (!sameHud(prev, now)) {
        if (prev.status !== "over" && now.status === "over") gameOverRef.current(now.score);
        prev = now;
        setHud(now);
      }
      frame = requestAnimationFrame(tick);
    };
    render(performance.now());
    frame = requestAnimationFrame(tick);

    const onKeyDown = (e: KeyboardEvent) => {
      // Leave typing, shortcuts (⌘K palette) and open dialogs alone.
      if (isEditable(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (document.querySelector("dialog[open]")) return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

      if (key === "p" || key === "Escape") {
        if (game.status === "playing" || game.status === "paused") {
          game.togglePause();
          e.preventDefault();
        }
        return;
      }
      if (game.status !== "playing") return;

      let handled = true;
      switch (key) {
        case "ArrowLeft": game.setHoriz(-1); break;
        case "ArrowRight": game.setHoriz(1); break;
        case "ArrowDown": game.setSoftDrop(true); break;
        case "ArrowUp": case "x": if (!e.repeat) game.rotate(1); break;
        case "z": if (!e.repeat) game.rotate(-1); break;
        case " ": if (!e.repeat) game.hardDrop(); break;
        case "c": case "Shift": if (!e.repeat) game.holdPiece(); break;
        default: handled = false;
      }
      if (handled) e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") game.releaseHoriz(-1);
      else if (e.key === "ArrowRight") game.releaseHoriz(1);
      else if (e.key === "ArrowDown") game.setSoftDrop(false);
    };
    // Leaving the tab or window pauses: keys released elsewhere never arrive,
    // and nobody wants to come back to a topped-out board.
    const onHide = () => { if (game.status === "playing") game.pause(); };
    const onVisibility = () => { if (document.visibilityState === "hidden") onHide(); };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onHide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onHide);
      document.removeEventListener("visibilitychange", onVisibility);
      motion?.removeEventListener?.("change", syncMotion);
      if (overTimerRef.current) clearTimeout(overTimerRef.current);
      gameRef.current = null;
      effectsRef.current = null;
    };
  }, []);

  // ---- Controls -------------------------------------------------------------

  const startGame = () => {
    const game = gameRef.current;
    if (!game) return;
    dialogRef.current?.close();
    if (overTimerRef.current) { clearTimeout(overTimerRef.current); overTimerRef.current = null; }
    setFinal(null);
    setCallouts([]);
    effectsRef.current?.reset();
    game.start();
    setAnnouncement("New game started.");
  };

  const togglePause = () => gameRef.current?.togglePause();

  const padDown = (action: PadAction) => (e: ReactPointerEvent<HTMLButtonElement>) => {
    const game = gameRef.current;
    if (!game || !game.playing) return;
    e.preventDefault();
    // Capture so the release still arrives if the thumb slides off the button.
    e.currentTarget.setPointerCapture?.(e.pointerId);
    switch (action) {
      case "left": game.setHoriz(-1); break;
      case "right": game.setHoriz(1); break;
      case "soft": game.setSoftDrop(true); break;
      case "cw": game.rotate(1); break;
      case "ccw": game.rotate(-1); break;
      case "hard": game.hardDrop(); break;
      case "hold": game.holdPiece(); break;
    }
  };
  const padUp = (action: PadAction) => () => {
    const game = gameRef.current;
    if (!game) return;
    if (action === "left") game.releaseHoriz(-1);
    else if (action === "right") game.releaseHoriz(1);
    else if (action === "soft") game.setSoftDrop(false);
  };
  const padProps = (action: PadAction) => ({
    onPointerDown: padDown(action),
    onPointerUp: padUp(action),
    onPointerCancel: padUp(action),
    onLostPointerCapture: padUp(action),
    onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
  });

  const saveName = (e: FormEvent) => {
    e.preventDefault();
    const name = nameInputRef.current?.value.trim().slice(0, MAX_NAME);
    if (!name || !final) return;
    setUsername(name);
    writeStorage(NAME_KEY, name);
    submitScore(name, final.score);
  };

  const forgetName = () => {
    setUsername(null);
    writeStorage(NAME_KEY, null);
  };

  const status = hud.status;
  const padButton = "px-3 py-3 bg-neutral text-neutral-content rounded text-lg font-bold select-none";

  return (
    <>
      <dialog
        id="gameover-dialog"
        ref={dialogRef}
        aria-labelledby="gameover-title"
        className="rounded-xl bg-base-200 text-base-content shadow-xl backdrop:bg-black/50 p-0 w-[min(24rem,calc(100vw-2rem))]"
      >
        <div className="p-6 sm:p-8 space-y-4 text-center">
          <h2 id="gameover-title" className="text-2xl font-bold">Game over</h2>
          <p className="text-lg">
            Score: <strong>{final?.score ?? 0}</strong>
            {final?.newBest && final.score > 0 && <span className="block text-primary font-bold">New personal best!</span>}
          </p>

          {final && final.score > 0 && (username ? (
            <p className="text-sm text-base-content/70" aria-live="polite">
              {saveState === "saving" && `Saving as ${username}…`}
              {saveState === "saved" && `Saved to the leaderboard as ${username}.`}
              {saveState === "error" && (
                <>Couldn&apos;t reach the leaderboard.{" "}
                  <button type="button" className="underline" onClick={() => submitScore(username, final.score)}>Try again</button>
                </>
              )}
            </p>
          ) : (
            <form onSubmit={saveName} className="space-y-2 text-left">
              <label htmlFor="tetris-name" className="block text-sm font-bold">Name for the leaderboard</label>
              <div className="flex gap-2">
                <input
                  id="tetris-name" ref={nameInputRef} type="text" maxLength={MAX_NAME} required autoComplete="nickname"
                  className="min-w-0 flex-1 px-3 py-2 rounded bg-base-100 text-base-content border border-base-content/20 focus:border-primary focus:outline-none"
                  placeholder="Your name"
                />
                <button type="submit" className="px-4 py-2 bg-neutral text-neutral-content rounded">Save</button>
              </div>
              {saveState === "error" && <p className="text-sm text-error">Couldn&apos;t reach the leaderboard. Try again?</p>}
            </form>
          ))}

          <div className="flex justify-center gap-2 pt-2">
            <button type="button" onClick={startGame} className="px-6 py-2 bg-primary text-primary-content rounded hover:opacity-90 transition">
              Play again
            </button>
            <button type="button" onClick={() => dialogRef.current?.close()} className="px-4 py-2 bg-neutral text-neutral-content rounded">
              Close
            </button>
          </div>
        </div>
      </dialog>

      <h1 className="text-3xl font-bold my-6">Tetris</h1>

      <div className="flex gap-3 sm:gap-4 items-start">
        <div ref={boardWrapRef} className="relative flex-1 min-w-0 max-w-[300px] will-change-transform">
          <canvas
            id="board" ref={boardRef} width={BOARD_W} height={BOARD_H}
            role="img" aria-label="Tetris playfield"
            className="block w-full h-auto rounded touch-none"
          />
          {status !== "playing" && (status !== "over" || final) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 text-white text-center p-4 rounded">
              {status === "paused" ? (
                <>
                  <p className="text-2xl font-bold">Paused</p>
                  <button type="button" onClick={togglePause} className="px-6 py-2 bg-primary text-primary-content rounded hover:opacity-90 transition">
                    Resume
                  </button>
                  <p className="text-xs opacity-80">P or Esc</p>
                </>
              ) : (
                <>
                  {status === "over" && <p className="text-2xl font-bold">Game over</p>}
                  <button type="button" onClick={startGame} className="px-6 py-2 bg-primary text-primary-content rounded hover:opacity-90 transition">
                    {status === "over" ? "Play again" : "Start game"}
                  </button>
                </>
              )}
            </div>
          )}
          <div aria-hidden="true" className="absolute inset-x-0 top-[28%] flex flex-col items-center gap-1 px-2 pointer-events-none">
            {callouts.map((c) => (
              <p
                key={c.id}
                className={`kk-tetris-callout kk-tetris-callout--${c.kind}`}
                style={c.color ? { color: c.color } : undefined}
                onAnimationEnd={(e) => {
                  if (e.target === e.currentTarget) setCallouts(list => list.filter(item => item.id !== c.id));
                }}
              >
                {c.text}
              </p>
            ))}
          </div>
        </div>

        <div className="w-[76px] sm:w-24 shrink-0 space-y-3 text-sm">
          <div>
            <p className="font-bold">Next</p>
            <canvas id="next" ref={nextRef} width={PREVIEW_W} height={PREVIEW_SLOT_H * NEXT_COUNT} role="img"
                    aria-label={hud.queue.length ? `Next pieces: ${hud.queue.slice(0, NEXT_COUNT).join(", ")}` : "Next pieces"}
                    className="block w-full h-auto rounded" />
          </div>
          <div>
            <p className="font-bold">Hold</p>
            <canvas id="hold" ref={holdRef} width={PREVIEW_W} height={PREVIEW_SLOT_H} role="img"
                    aria-label={hud.hold ? `Held piece: ${hud.hold}` : "No piece held"} className="block w-full h-auto rounded" />
          </div>
          <dl className="space-y-1 tabular-nums">
            <div><dt className="text-base-content/70">Score</dt><dd id="score" className="font-bold">{hud.score}</dd></div>
            <div><dt className="text-base-content/70">Level</dt><dd id="level" className="font-bold">{hud.level}</dd></div>
            <div><dt className="text-base-content/70">Lines</dt><dd id="lines" className="font-bold">{hud.lines}</dd></div>
            <div><dt className="text-base-content/70">Best</dt><dd id="highscore" className="font-bold">{best}</dd></div>
          </dl>
          {(status === "playing" || status === "paused") && (
            <button type="button" onClick={togglePause} className="w-full px-2 py-1 bg-neutral text-neutral-content rounded">
              {status === "paused" ? "Resume" : "Pause"}
            </button>
          )}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">{announcement}</p>

      <div className="kk-tetris-pad mt-4 max-w-[400px] grid-cols-4 gap-2 touch-none" aria-label="Touch controls" role="group">
        <button type="button" aria-label="Hold piece" className={padButton} {...padProps("hold")}>Hold</button>
        <button type="button" aria-label="Rotate anticlockwise" className={padButton} {...padProps("ccw")}>&#10226;</button>
        <button type="button" aria-label="Rotate clockwise" className={padButton} {...padProps("cw")}>&#10227;</button>
        <button type="button" aria-label="Hard drop" className={padButton} {...padProps("hard")}>&#10515;</button>
        <button type="button" aria-label="Move left" className={padButton} {...padProps("left")}>&#9664;</button>
        <button type="button" aria-label="Soft drop" className={`${padButton} col-span-2`} {...padProps("soft")}>&#9660;</button>
        <button type="button" aria-label="Move right" className={padButton} {...padProps("right")}>&#9654;</button>
      </div>

      <section aria-labelledby="tetris-controls" className="mt-4 max-w-[400px] text-sm">
        <h2 id="tetris-controls" className="font-bold mb-2">Controls</h2>
        <dl className="kk-tetris-keys grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 items-center">
          {KEY_LEGEND.map(([keys, action]) => (
            <div key={action} className="contents">
              <dt className="flex flex-wrap gap-1">
                {keys.map((k) => <kbd key={k} className="kbd kbd-sm">{k}</kbd>)}
              </dt>
              <dd>{action}</dd>
            </div>
          ))}
        </dl>
        <dl className="kk-tetris-touch grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 items-center">
          {TOUCH_LEGEND.map(([icon, action]) => (
            <div key={action} className="contents">
              <dt className="min-w-[2.5rem] text-center font-bold">{icon}</dt>
              <dd>{action}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-6">
        <h2 className="font-bold">Leaderboard</h2>
        {lbError && <p className="text-sm text-base-content/70">Couldn&apos;t load the leaderboard right now.</p>}
        {!lbError && leaderboard.length === 0 && <p className="text-sm text-base-content/70">No scores yet. Be the first!</p>}
        <ol id="leaderboard" className="list-decimal ml-6">
          {leaderboard.map((entry) => (
            <li key={entry.name} className={entry.name === username ? "font-bold text-primary" : undefined}>
              {entry.name}: {entry.score}
            </li>
          ))}
        </ol>
        {username && (
          <p className="mt-2 text-sm text-base-content/70">
            Playing as {username}.{" "}
            <button type="button" className="underline" onClick={forgetName}>Change name</button>
          </p>
        )}
      </div>
    </>
  );
}

export default Tetris;
