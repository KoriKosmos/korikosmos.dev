import { JSDOM } from 'jsdom';

/** Isolated DOM for React interaction tests. This does not emulate layout. */
export function setupDom(html = '<div id="root"></div>') {
  const dom = new JSDOM(html, { url: 'https://korikosmos.dev/blog/example#details' });
  const frames = new Map<number, FrameRequestCallback>();
  let frameId = 0;
  const values = {
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    localStorage: dom.window.localStorage,
    HTMLElement: dom.window.HTMLElement,
    requestAnimationFrame: (callback: FrameRequestCallback) => { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame: (id: number) => { frames.delete(id); },
    IS_REACT_ACT_ENVIRONMENT: true,
  };
  const previous = new Map(Object.keys(values).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(values)) {
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  return {
    dom,
    flushFrames() {
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach(callback => callback(0));
    },
    cleanup() {
      dom.window.close();
      for (const [key, descriptor] of previous) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
      }
    },
  };
}
