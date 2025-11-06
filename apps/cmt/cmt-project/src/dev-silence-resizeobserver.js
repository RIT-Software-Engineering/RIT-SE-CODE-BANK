// Silences Chrome "ResizeObserver loop..." noise in CRA dev overlay
(function () {
  const matches = (msg) =>
    typeof msg === "string" &&
    (msg.includes("ResizeObserver loop limit exceeded") ||
     msg.includes("ResizeObserver loop completed with undelivered notifications"));

  // 1) Event listeners (capture) – blocks CRA overlay listeners
  const onError = (e) => {
    const msg = String(e?.message || "");
    if (matches(msg)) {
      e.stopImmediatePropagation?.();
      e.preventDefault?.();
      return false;
    }
  };
  const onRejection = (e) => {
    const msg = String(e?.reason?.message || e?.reason || "");
    if (matches(msg)) {
      e.stopImmediatePropagation?.();
      e.preventDefault?.();
      return false;
    }
  };
  window.addEventListener("error", onError, true);
  window.addEventListener("unhandledrejection", onRejection, true);

  // 2) Legacy handlers – some CRA versions still check these
  const oldOnError = window.onerror;
  window.onerror = function (msg, src, line, col, err) {
    if (matches(String(msg))) return true; // swallow
    return oldOnError?.(msg, src, line, col, err);
  };

  const oldOnRejection = window.onunhandledrejection;
  window.onunhandledrejection = function (e) {
    const msg = String(e?.reason?.message || e?.reason || "");
    if (matches(msg)) return true; // swallow
    return oldOnRejection?.(e);
  };
})();
