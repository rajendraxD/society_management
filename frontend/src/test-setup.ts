// Polyfills for running unit tests under jsdom (the default Vitest environment).
// Ionic components such as ion-menu and ion-split-pane query `window.matchMedia`,
// which jsdom does not implement.
if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

const addZoneListenerPolyfills = (target: any) => {
  if (target && !target.__zone_symbol__addEventListener && target.addEventListener) {
    target.__zone_symbol__addEventListener = target.addEventListener;
    target.__zone_symbol__removeEventListener = target.removeEventListener;
  }
};

addZoneListenerPolyfills(typeof window !== "undefined" ? window : null);
addZoneListenerPolyfills(typeof document !== "undefined" ? document : null);
addZoneListenerPolyfills(typeof EventTarget !== "undefined" ? EventTarget.prototype : null);
addZoneListenerPolyfills(typeof Element !== "undefined" ? Element.prototype : null);
addZoneListenerPolyfills(typeof HTMLElement !== "undefined" ? HTMLElement.prototype : null);
