import ResizeObserverPolyfill from "resize-observer-polyfill";

if (typeof window !== "undefined" && window.ResizeObserver !== ResizeObserverPolyfill) {
  window.ResizeObserver = ResizeObserverPolyfill;
}