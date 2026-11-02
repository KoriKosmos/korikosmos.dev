import { createPulsoidClient } from './pulsoidClient';

// Server-only: the token is a credential. Never import this from an island.
const client = createPulsoidClient({
  token: import.meta.env.PULSOID_ACCESS_TOKEN || process.env.PULSOID_ACCESS_TOKEN,
  widgetUrl: import.meta.env.PULSOID_WIDGET_URL || process.env.PULSOID_WIDGET_URL,
});

/** Shells mount the heart-rate island only when a token or widget URL is set. */
export const heartRateEnabled = client.enabled;
/** Server-rendered starting state: the widget straight away when there's no token. */
export const initialHeartRate = client.initial;
export const getHeartRate = client.getHeartRate;
