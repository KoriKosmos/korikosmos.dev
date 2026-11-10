import { useEffect, useState } from "react";
import { hapticsEnabled, setHapticsEnabled, subscribeHaptics } from "../lib/haptics";

interface Props {
  /** Whether a controller is connected; the toggle shows for pads and phones. */
  padConnected: boolean;
}

/**
 * A "Vibration" switch for the games. It only appears where something can
 * actually buzz: a connected controller, or a touch device with the Vibration
 * API. Rendered after mount, since the server can't know either.
 */
export function HapticsToggle({ padConnected }: Props) {
  const [mounted, setMounted] = useState(false);
  const [canVibrate, setCanVibrate] = useState(false);
  const [on, setOn] = useState(true);

  useEffect(() => {
    setMounted(true);
    setOn(hapticsEnabled());
    const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
    setCanVibrate(coarse && typeof navigator.vibrate === "function");
    return subscribeHaptics(setOn);
  }, []);

  if (!mounted || !(padConnected || canVibrate)) return null;
  return (
    <label className="kk-haptics-toggle inline-flex items-center gap-2 text-sm cursor-pointer select-none">
      <input
        type="checkbox"
        className="checkbox checkbox-sm"
        checked={on}
        onChange={(e) => setHapticsEnabled(e.currentTarget.checked)}
      />
      Vibration
    </label>
  );
}

export default HapticsToggle;
