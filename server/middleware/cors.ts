import {
  corsHeadersForOrigin,
  parseCorsAllowlist,
} from "../utils/security-config";

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname;
  if (!path.startsWith("/api/")) return;

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

  if (getMethod(event) === "OPTIONS") {
    setResponseStatus(event, 204);
    return "";
  }
});
