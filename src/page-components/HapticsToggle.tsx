import { useEffect, useState, type FormEvent } from "react";
import { hapticsEnabled, setHapticsEnabled, subscribeHaptics } from "../lib/haptics";
import {
  DEFAULT_LOVENSE_PORT, loadLovenseConfig, parseLovenseConfig, saveLovenseConfig, testLovense,
  type LovenseConfig,
} from "../lib/lovense";

interface Props {
  /** Whether a controller is connected; the toggle shows for pads and phones. */
  padConnected: boolean;
}

/**
 * A "Vibration" switch for the games. It only appears where something can
 * actually buzz: a connected controller, a touch device with the Vibration
 * API, or a configured Lovense toy. Rendered after mount, since the server
 * can't know any of those.
 */
export function HapticsToggle({ padConnected }: Props) {
  const [mounted, setMounted] = useState(false);
  const [canVibrate, setCanVibrate] = useState(false);
  const [on, setOn] = useState(true);
  const [lovense, setLovense] = useState<LovenseConfig | null>(null);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    setMounted(true);
    setOn(hapticsEnabled());
    const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
    setCanVibrate(coarse && typeof navigator.vibrate === "function");
    const config = loadLovenseConfig();
    setLovense(config);
    // The Lovense setup is unlisted: only `?lovense` (or an existing setup) shows it.
    setShowSetup(!!config || new URLSearchParams(window.location.search).has("lovense"));
    return subscribeHaptics(setOn);
  }, []);

  if (!mounted || !(padConnected || canVibrate || lovense || showSetup)) return null;
  return (
    <div className="kk-haptics inline-flex flex-col gap-2 text-sm">
      <label className="kk-haptics-toggle inline-flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          className="checkbox checkbox-sm"
          checked={on}
          onChange={(e) => setHapticsEnabled(e.currentTarget.checked)}
        />
        Vibration
      </label>
      {showSetup && <LovenseSetup config={lovense} onChange={setLovense} />}
    </div>
  );
}

function LovenseSetup({ config, onChange }: { config: LovenseConfig | null; onChange: (c: LovenseConfig | null) => void }) {
  const [status, setStatus] = useState<"idle" | "testing" | "ok" | "failed" | "invalid">("idle");

  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const next = parseLovenseConfig({ host: data.get("host"), port: data.get("port") });
    if (!next) { setStatus("invalid"); return; }
    saveLovenseConfig(next);
    onChange(next);
    setStatus("testing");
    setStatus(await testLovense(next) ? "ok" : "failed");
  };

  const remove = () => {
    saveLovenseConfig(null);
    onChange(null);
    setStatus("idle");
  };

  return (
    <details className="kk-lovense" open={!config}>
      <summary className="cursor-pointer">Lovense{config ? ` (${config.host})` : ""}</summary>
      <form onSubmit={save} className="mt-2 space-y-2">
        <p className="opacity-70">Turn on Game Mode in Lovense Remote on the same network, then enter its Local IP and HTTPS port.</p>
        <div className="flex flex-wrap gap-2">
          <label className="flex flex-col">
            <span>Local IP</span>
            <input name="host" defaultValue={config?.host ?? ""} required inputMode="decimal" placeholder="192.168.1.44"
                   className="input input-sm input-bordered w-36" />
          </label>
          <label className="flex flex-col">
            <span>Port</span>
            <input name="port" defaultValue={config?.port ?? DEFAULT_LOVENSE_PORT} required inputMode="numeric"
                   className="input input-sm input-bordered w-24" />
          </label>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-sm">Save &amp; test</button>
          {config && <button type="button" className="btn btn-sm btn-ghost" onClick={remove}>Remove</button>}
        </div>
        <p aria-live="polite">
          {status === "testing" && "Sending a test buzz…"}
          {status === "ok" && "Connected."}
          {status === "failed" && "No answer. Check Game Mode, the IP, and that this device is on the same network."}
          {status === "invalid" && "Enter a local network IP (192.168.x.x, 10.x.x.x, or 172.16–31.x.x) and a port."}
        </p>
      </form>
    </details>
  );
}

export default HapticsToggle;
