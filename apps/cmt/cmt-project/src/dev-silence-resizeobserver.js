// Silences Chrome's noisy ResizeObserver dev error overlay in CRA.
// Only affect this specific message; let real errors through.

(function () {
  const shouldSilence = (msg) =>
    typeof msg === "string" &&
    (msg.includes("ResizeObserver loop limit exceeded") ||
     msg.includes("ResizeObserver loop completed with undelivered notifications"));

  // Intercept window 'error' events
  const onError = (e) => {
    const msg = String(e?.message || "");
    if (shouldSilence(msg)) {
      // stop CRA overlay from seeing it
      e.stopImmediatePropagation?.();
      e.preventDefault?.();
      return false;
    }
    return undefined;
  };

  // Intercept unhandled promise rejections too (some builds surface it this way)
  const onRejection = (e) => {
    const msg = String(e?.reason?.message || e?.reason || "");
    if (shouldSilence(msg)) {
      e.stopImmediatePropagation?.();
      e.preventDefault?.();
      return false;
    }
    return undefined;
  };

  window.addEventListener("error", onError, true);
  window.addEventListener("unhandledrejection", onRejection, true);
})();
