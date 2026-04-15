// Helper: decode a JWT without any external libraries
function decodeJwt(token) {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length < 2) return null;

  const base64Url = parts[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

  // Pad with '=' to make length a multiple of 4
  const padded = base64 + "===".slice((base64.length + 3) % 4);

  try {
    const jsonPayload = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error("Failed to decode JWT:", err);
    return null;
  }
}

export function getUserFromCookie() {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";").map((c) => c.trim());
  const jwtCookie = cookies.find((c) => c.startsWith("cmt_id="));
  if (!jwtCookie) return null;

  const token = jwtCookie.split("=")[1];
  return decodeJwt(token);
}

export function logout() {
  if (typeof document === "undefined") return;

  // Clear the cookie by setting an expired date
  document.cookie =
    "cmt_id=; Path=/; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT";

  // Kick user back to login
  window.location.href = "/cmt/login";
}
