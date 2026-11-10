"use client";

import toast from "react-hot-toast";

function getErrorMessage(err) {
  if (!err) return "Something went wrong.";
  if (typeof err === "string") return err;
  if (err instanceof Error && err.message) return err.message;

  // Common fetch patterns
  if (typeof err === "object") {
    const maybeMessage = err.message || err.error || err.detail;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) return maybeMessage;
  }

  return "Something went wrong.";
}

async function getErrorMessageFromResponse(res) {
  if (!res) return "Something went wrong.";
  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  const serverMsg =
    (payload && (payload.error || payload.message || payload.detail)) || null;
  if (typeof serverMsg === "string" && serverMsg.trim()) {
    return `${serverMsg} (HTTP ${res.status})`;
  }
  if (res.status === 409) return "A resource already exists. (HTTP 409)";
  if (res.status === 400) return "Invalid request. (HTTP 400)";
  if (res.status === 401) return "You are not signed in. (HTTP 401)";
  if (res.status === 403) return "You don’t have permission to do that. (HTTP 403)";
  if (res.status === 404) return "Not found. (HTTP 404)";
  return `Request failed. (HTTP ${res.status})`;
}

export const notify = {
  success(message, opts) {
    return toast.success(message, opts);
  },
  error(messageOrError, opts) {
    return toast.error(getErrorMessage(messageOrError), opts);
  },
  info(message, opts) {
    return toast(message, opts);
  },
  warning(message, opts) {
    // react-hot-toast has no built-in warning variant; use neutral toast.
    return toast(message, opts);
  },
  promise(promise, { loading, success, error }, opts) {
    return toast.promise(
      promise,
      {
        loading: loading || "Working…",
        success: success || "Done.",
        error: (e) => (typeof error === "function" ? error(e) : error || getErrorMessage(e)),
      },
      opts
    );
  },
  getErrorMessage,
  getErrorMessageFromResponse,
};

