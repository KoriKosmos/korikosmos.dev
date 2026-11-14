import { createHealthDisplayClient, withHealthDisplay } from './healthDisplayClient';
import { createPulsoidClient } from './pulsoidClient';

// Server-only: the tokens are credentials. Never import this from an island.
// Each variable is read by name so Vite can replace it statically.
const healthDisplay = createHealthDisplayClient({
  url: import.meta.env.HEALTH_STATUS_URL || process.env.HEALTH_STATUS_URL,
  token: import.meta.env.HEALTH_STATUS_TOKEN || process.env.HEALTH_STATUS_TOKEN,
});

const pulsoid = createPulsoidClient({
  token: import.meta.env.PULSOID_ACCESS_TOKEN || process.env.PULSOID_ACCESS_TOKEN,
  widgetUrl: import.meta.env.PULSOID_WIDGET_URL || process.env.PULSOID_WIDGET_URL,
});

// Health Display when it's configured and answering; Pulsoid otherwise.
const source = withHealthDisplay(healthDisplay, pulsoid);

/** Shells mount the heart-rate islands only when some source is configured. */
export const heartRateEnabled = source.enabled;
/** Server-rendered starting state: the widget straight away when it's the only source. */
export const initialHeartRate = source.initial;
export const getHeartRate = source.getHeartRate;
