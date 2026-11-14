import { useCallback, useEffect, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from "react";
import {
  NEXT_COUNT, TetrisEngine, clearTitle, describeClear,
  type ClearResult, type GameEvent, type GameStatus, type PieceType,
} from "../lib/tetris";
import {
  BOARD_H, BOARD_W, PREVIEW_SLOT_H, PREVIEW_W, drawBoard, drawPreview, setupCanvas,
} from "../lib/tetrisCanvas";
import { TOP_OUT_MS, TetrisEffects } from "../lib/tetrisEffects";
import { GamepadReader, otherDialogOpen, type PadButton, type PadFrame } from "../lib/gamepad";
import { haptic, trackInputSource, type HapticKind } from "../lib/haptics";
import { HapticsToggle } from "./HapticsToggle";
import { dailyKey, dailyRandom } from "../lib/daily";

const BEST_KEY = "tetris_highscore";
const NAME_KEY = "tetris_username";
const MAX_NAME = 20;
/** Longest frame the engine will simulate; a stalled tab must not dump gravity. */
const MAX_FRAME_MS = 100;
const LEADERBOARD_REFRESH_MS = 60_000;

interface LeaderboardEntry { name: string; score: number }
interface DailyBoard { day: string; scores: LeaderboardEntry[] }

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

/** Gamepad legend; the buttons must match onPad below. Standard (Xbox) names. */
const PAD_LEGEND: [string[], string][] = [
  [["D-pad ◀ ▶", "Stick"], "Move (hold to slide)"],
  [["▼"], "Soft drop"],
  [["▲"], "Hard drop"],
  [["A"], "Rotate clockwise"],
  [["B"], "Rotate anticlockwise"],
  [["LB", "RB"], "Hold piece"],
  [["Start"], "Start / pause / resume"],
];

type CalloutKind = "clear" | "tetris" | "tspin" | "perfect" | "combo" | "level" | "points";
interface Callout { id: number; text: string; kind: CalloutKind; color?: string }
/** Callouts on screen at once; older ones are dropped rather than queued. */
const MAX_CALLOUTS = 5;
/**
 * Hard ceiling on a callout's life, a little past the longest entrance in
 * global.css (the 2.2s perfect-clear slam). animationend normally removes it
 * sooner, but a stylesheet that overrides or kills the animation (a skin's
 * reduced-motion rule, say) must never leave stale text over the board.
 */
export const CALLOUT_MAX_MS = 2600;

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

/** Strongest first: one buzz per frame, for the biggest thing that happened. */
const HAPTIC_RANK: HapticKind[] = ["over", "big", "clear", "drop"];

/** The rumble a frame's events earn, if any. Moves and rotations stay quiet. */
export function hapticFor(events: readonly GameEvent[]): HapticKind | null {
  const kinds = new Set<HapticKind>();
  for (const event of events) {
    if (event.type === "gameOver") kinds.add("over");
    else if (event.type === "hardDrop") kinds.add("drop");
    else if (event.type === "clear") {
      const { lines, tSpin, perfectClear } = event.result;
      kinds.add(lines === 4 || tSpin !== "none" || perfectClear ? "big" : "clear");
    }
  }
  return HAPTIC_RANK.find(kind => kinds.has(kind)) ?? null;
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
  const calloutTimersRef = useRef(new Set<ReturnType<typeof setTimeout>>());
  const [final, setFinal] = useState<{ score: number; newBest: boolean } | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [padConnected, setPadConnected] = useState(false);
  const [lbError, setLbError] = useState(false);
  const [daily, setDaily] = useState<DailyBoard | null>(null);
  // The day the current game's pieces were dealt for, or null for a free game.
  const [dailyDay, setDailyDay] = useState<string | null>(null);
  const dailyDayRef = useRef<string | null>(null);

  // Latest values for callbacks that live inside the animation loop.
  const bestRef = useRef(0);
  const usernameRef = useRef<string | null>(null);
  useEffect(() => { bestRef.current = best; }, [best]);
  useEffect(() => { usernameRef.current = username; }, [username]);

  // ---- Leaderboard -------------------------------------------------------

  const loadLeaderboard = useCallback(async (signal?: AbortSignal) => {
    try {
      const [res, dailyRes] = await Promise.all([
        fetch("/api/scores/tetris", { signal }),
        fetch("/api/scores/tetris-daily", { signal }).catch(() => null),
      ]);
      if (!res.ok) throw new Error(String(res.status));
      setLeaderboard(await res.json());
      if (dailyRes?.ok) setDaily(await dailyRes.json());
      setLbError(false);
    } catch (error) {
      if ((error as Error).name !== "AbortError") setLbError(true);
    }
  }, []);

  /** Saves to the all-time board, and to the daily one if `day` is set. */
  const submitScore = useCallback(async (name: string, score: number, day: string | null = null) => {
    const post = (path: string, body: unknown) => fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaveState("saving");
    try {
      const [res, dailyRes] = await Promise.all([
        post("/api/scores/tetris", { name, score }),
        day ? post("/api/scores/tetris-daily", { name, score, day }) : null,
      ]);
      if (!res.ok) throw new Error(String(res.status));
      setLeaderboard(await res.json());
      // A 409 means midnight passed mid-game: the all-time score still counts.
      if (dailyRes?.ok) setDaily(await dailyRes.json());
      else if (dailyRes && dailyRes.status !== 409) throw new Error(String(dailyRes.status));
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
    if (name && score > 0) submitScore(name, score, dailyDayRef.current);
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
    const pads = new GamepadReader();
    let padWasConnected = false;
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
      onPad(pads.poll());
      game.step(dt);

      const fresh: Callout[] = [];
      const events = game.takeEvents();
      const buzz = hapticFor(events);
      if (buzz) haptic(buzz);
      for (const event of events) {
        effects.push(event, time);
        if (event.type === "clear") {
          fresh.push(...calloutsFor(event.result, nextId));
          const label = describeClear(event.result);
          if (label) setAnnouncement(`${label}, plus ${event.result.points}.`);
        } else if (event.type === "levelUp") {
          fresh.push({ id: nextId(), text: `Level ${event.level}`, kind: "level" });
        }
      }
      if (fresh.length) {
        setCallouts(list => [...list, ...fresh].slice(-MAX_CALLOUTS));
        const ids = new Set(fresh.map(c => c.id));
        const timers = calloutTimersRef.current;
        const timer = setTimeout(() => {
          timers.delete(timer);
          setCallouts(list => list.filter(c => !ids.has(c.id)));
        }, CALLOUT_MAX_MS);
        timers.add(timer);
      }
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
    // Gamepads have no events, so the loop polls them each frame and acts on
    // the edges. Directions mirror the arrow keys: press to start, release to stop.
    const onPad = (frame: PadFrame) => {
      if (frame.connected !== padWasConnected) {
        padWasConnected = frame.connected;
        setPadConnected(frame.connected);
        // A controller that drops out mid-game can't let go of anything.
        if (!frame.connected && game.status === "playing") game.pause();
      }
      const { pressed, released } = frame;
      if (released.has("left")) game.releaseHoriz(-1);
      if (released.has("right")) game.releaseHoriz(1);
      if (released.has("down")) game.setSoftDrop(false);
      if (!pressed.size || otherDialogOpen(dialogRef.current)) return;

      const gameOverOpen = !!dialogRef.current?.open;
      const has = (b: PadButton) => pressed.has(b);
      if (game.status === "ready" || game.status === "over") {
        // Start restarts from the game-over dialog too; A only from the overlay.
        if (has("start") || (has("a") && !gameOverOpen)) startRef.current(game.status === "over" && dailyDayRef.current !== null);
        return;
      }
      if (gameOverOpen) return;
      if (has("start")) { game.togglePause(); return; }
      if (game.status !== "playing") return;
      if (has("left")) game.setHoriz(-1);
      if (has("right")) game.setHoriz(1);
      if (has("down")) game.setSoftDrop(true);
      if (has("a")) game.rotate(1);
      if (has("b")) game.rotate(-1);
      if (has("lb") || has("rb")) game.holdPiece();
      if (has("up")) game.hardDrop();
    };
    const onConnect = () => setPadConnected(true);
    const stopTracking = trackInputSource();

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
    window.addEventListener("gamepadconnected", onConnect);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      stopTracking();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onHide);
      window.removeEventListener("gamepadconnected", onConnect);
      document.removeEventListener("visibilitychange", onVisibility);
      motion?.removeEventListener?.("change", syncMotion);
      if (overTimerRef.current) clearTimeout(overTimerRef.current);
      calloutTimersRef.current.forEach(clearTimeout);
      calloutTimersRef.current.clear();
      gameRef.current = null;
      effectsRef.current = null;
    };
  }, []);

  // ---- Controls -------------------------------------------------------------

  const startGame = (asDaily = false) => {
    const game = gameRef.current;
    if (!game) return;
    const day = asDaily ? dailyKey() : null;
    dailyDayRef.current = day;
    setDailyDay(day);
    dialogRef.current?.close();
    if (overTimerRef.current) { clearTimeout(overTimerRef.current); overTimerRef.current = null; }
    setFinal(null);
    setCallouts([]);
    effectsRef.current?.reset();
    game.start(day ? dailyRandom("tetris", day) : undefined);
    setAnnouncement(day ? "Daily challenge started. Everyone gets these pieces today." : "New game started.");
  };

  const startRef = useRef(startGame);
  startRef.current = startGame;

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
    submitScore(name, final.score, dailyDay);
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
                  <button type="button" className="underline" onClick={() => submitScore(username, final.score, dailyDay)}>Try again</button>
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

          {dailyDay && <p className="text-sm text-base-content/70">That was the daily challenge for {dailyDay}. Same pieces for everyone until midnight UTC.</p>}
          <div className="flex justify-center gap-2 pt-2">
            <button type="button" onClick={() => startGame(!!dailyDay)} className="px-6 py-2 bg-primary text-primary-content rounded hover:opacity-90 transition">
              {dailyDay ? "Retry daily" : "Play again"}
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
                  <p className="text-xs opacity-80">{padConnected ? "P, Esc, or Start" : "P or Esc"}</p>
                </>
              ) : (
                <>
                  {status === "over" && <p className="text-2xl font-bold">Game over</p>}
                  <button type="button" onClick={() => startGame()} className="px-6 py-2 bg-primary text-primary-content rounded hover:opacity-90 transition">
                    {status === "over" ? "Play again" : "Start game"}
                  </button>
                  <button type="button" onClick={() => startGame(true)} className="px-4 py-1.5 bg-neutral text-neutral-content rounded text-sm">
                    Daily challenge
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
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 id="tetris-controls" className="font-bold">Controls</h2>
          <HapticsToggle padConnected={padConnected} />
        </div>
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
        {padConnected && (
          <dl className="kk-tetris-gamepad grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 items-center" aria-label="Controller">
            {PAD_LEGEND.map(([buttons, action]) => (
              <div key={action} className="contents">
                <dt className="flex flex-wrap gap-1">
                  {buttons.map((b) => <kbd key={b} className="kbd kbd-sm">{b}</kbd>)}
                </dt>
                <dd>{action}</dd>
              </div>
            ))}
          </dl>
        )}
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
        <h2 className="font-bold mt-4">Today&apos;s daily</h2>
        <p className="text-sm text-base-content/70">The same pieces for everyone, reset at midnight UTC.</p>
        {daily && daily.day === dailyKey() && daily.scores.length > 0 ? (
          <ol id="daily-leaderboard" className="list-decimal ml-6">
            {daily.scores.map((entry) => (
              <li key={entry.name} className={entry.name === username ? "font-bold text-primary" : undefined}>
                {entry.name}: {entry.score}
              </li>
            ))}
          </ol>
        ) : <p className="text-sm text-base-content/70">Nobody has played today&apos;s yet.</p>}
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
