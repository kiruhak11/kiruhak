import {
  corsHeadersForOrigin,
  parseCorsAllowlist,
} from "../utils/security-config";

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname;
  if (!path.startsWith("/api/")) return;

  const method = getMethod(event);
  const isTracking = path === "/api/analytics/track" ||
    path === "/api/analytics/track-simple";

  if (isTracking && (method === "POST" || method === "OPTIONS")) {
    setResponseHeader(event, "Access-Control-Allow-Origin", "*");
    if (method === "OPTIONS") {
      setResponseHeader(event, "Access-Control-Allow-Methods", "POST");
      setResponseHeader(event, "Access-Control-Allow-Headers", "Content-Type");
      setResponseStatus(event, 204);
      return "";
    }
    return;
  }

  appendResponseHeader(event, "Vary", "Origin");
  const config = useRuntimeConfig();
  const configuredOrigins = String(
    config.corsOrigins || process.env.CORS_ORIGINS || ""
  );
  const allowlist = parseCorsAllowlist(
    configuredOrigins ||
      (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000")
  );
  const headers = corsHeadersForOrigin(
    getRequestHeader(event, "origin"),
    allowlist
  );

  for (const [name, value] of Object.entries(headers)) {
    setResponseHeader(event, name, value);
  }

  if (method === "OPTIONS") {
    setResponseStatus(event, 204);
    return "";
  }
});
