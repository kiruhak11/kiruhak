const MATERIAL_DOWNLOAD_ROUTE = /^\/api\/materials\/[^/]+\/download-pdf(?:-simple)?$/;

export function isPublicApiRoute(path: string, method: string): boolean {
  if (path === "/api/auth/telegram" && method === "POST") return true;
  if (path === "/api/auth/login" && method === "POST") return true;
  if (path === "/api/auth/create-account" && method === "POST") return true;
  if (path.startsWith("/api/bot/") && method === "POST") return true;
  if (path === "/api/telegram" && method === "POST") return true;
  if (path === "/api/analytics/track" && method === "POST") return true;
  if (path === "/api/analytics/track-simple" && method === "POST") return true;
  if (path === "/api/health" && method === "GET") return true;
  if (path === "/api/health/db" && method === "GET") return true;
  if (path === "/api/projects" && method === "GET") return true;
  if (path === "/api/tutorials" && method === "GET") return true;
  if (path.startsWith("/api/tutorials/") && method === "GET") return true;
  if (path === "/api/materials" && method === "GET") return true;
  if (
    path.startsWith("/api/materials/") &&
    method === "GET" &&
    !MATERIAL_DOWNLOAD_ROUTE.test(path)
  ) {
    return true;
  }
  if (path === "/api/ui-components" && method === "GET") return true;
  if (path.match(/^\/api\/ui-components\/[^/]+\/view$/) && method === "POST") return true;
  if (path.includes("/bot-moderate")) return true;
  return false;
}

export function isAuthenticatedRoute(path: string, method: string): boolean {
  if (path.startsWith("/api/user/")) return true;
  if (path === "/api/sites" && (method === "GET" || method === "POST")) return true;
  if (path === "/api/telegram/check-subscription" && method === "POST") return true;
  if (path === "/api/analytics/stats" && method === "GET") return true;
  if (path === "/api/brief" && method === "POST") return true;
  if (path === "/api/ui-components/submit" && method === "POST") return true;
  if (path.match(/^\/api\/materials\/[^/]+\/rate$/) && method === "POST") return true;
  if (path.match(/^\/api\/materials\/[^/]+\/download$/) && method === "POST") return true;
  if (MATERIAL_DOWNLOAD_ROUTE.test(path) && method === "GET") return true;
  if (path.match(/^\/api\/tutorials\/[^/]+\/complete/) && method === "POST") return true;
  if (path.startsWith("/api/ui-components/") && method === "GET") return true;
  return false;
}

export function isValidMaterialId(id: unknown): id is string {
  return typeof id === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(id);
}
