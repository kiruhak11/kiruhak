import { prisma } from "../utils/prisma";
import { verifyAuthToken } from "../utils/auth-token";

function isStaticAsset(path: string): boolean {
  return (
    path.startsWith("/_nuxt/") ||
    path.startsWith("/assets/") ||
    path.startsWith("/images/") ||
    path === "/favicon.ico" ||
    /\.(js|css|png|jpe?g|svg|ico|woff2?)$/i.test(path)
  );
}

function isPublicApiRoute(path: string, method: string): boolean {
  if (path === "/api/auth/telegram" && method === "POST") return true;
  if (path === "/api/auth/login" && method === "POST") return true;
  if (path === "/api/auth/create-account" && method === "POST") return true;
  if (path === "/api/telegram" && method === "POST") return true;
  if (path === "/api/analytics/track" && method === "POST") return true;
  if (path === "/api/analytics/track-simple" && method === "POST") return true;
  if (path === "/api/health" && method === "GET") return true;
  if (path === "/api/health/db" && method === "GET") return true;
  if (path === "/api/projects" && method === "GET") return true;
  if (path === "/api/tutorials" && method === "GET") return true;
  if (path.startsWith("/api/tutorials/") && method === "GET") return true;
  if (path === "/api/materials" && method === "GET") return true;
  if (path.startsWith("/api/materials/") && method === "GET") return true;
  if (path === "/api/ui-components" && method === "GET") return true;
  if (path.match(/^\/api\/ui-components\/[^/]+\/view$/) && method === "POST") return true;
  if (path.includes("/bot-moderate")) return true;
  return false;
}

function isAuthenticatedRoute(path: string, method: string): boolean {
  if (path.startsWith("/api/user/")) return true;
  if (path === "/api/sites" && (method === "GET" || method === "POST")) return true;
  if (path === "/api/telegram/check-subscription" && method === "POST") return true;
  if (path === "/api/analytics/stats" && method === "GET") return true;
  if (path === "/api/ui-components/submit" && method === "POST") return true;
  if (path.match(/^\/api\/materials\/[^/]+\/rate$/) && method === "POST") return true;
  if (path.match(/^\/api\/materials\/[^/]+\/download$/) && method === "POST") return true;
  if (path.match(/^\/api\/materials\/[^/]+\/download-pdf/) && method === "GET") return true;
  if (path.match(/^\/api\/tutorials\/[^/]+\/complete/) && method === "POST") return true;
  if (path.startsWith("/api/ui-components/") && method === "GET") return true;
  return false;
}

function isAdminRoute(path: string, method: string): boolean {
  if (path.startsWith("/api/admin")) return true;
  if (path === "/api/projects" && method === "POST") return true;
  if (path.startsWith("/api/projects/") && method !== "GET") return true;
  if (path === "/api/materials" && method === "POST") return true;
  if (path.startsWith("/api/materials/") && !["GET", "POST"].includes(method)) return true;
  if (path === "/api/tutorials" && method === "POST") return true;
  if (path.startsWith("/api/tutorials/") && !["GET", "POST"].includes(method)) return true;
  if (path === "/api/ui-components" && method === "POST") return true;
  if (path.match(/^\/api\/ui-components\/[^/]+$/) && ["PUT", "DELETE"].includes(method)) return true;
  if (path.match(/^\/api\/ui-components\/[^/]+\/moderate$/) && method === "POST") return true;
  if (path === "/api/analytics/overview" && method === "GET") return true;
  return false;
}

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname;
  const method = getMethod(event);

  if (isStaticAsset(path)) return;
  if (!path.startsWith("/api/")) return;
  if (isPublicApiRoute(path, method)) return;

  const needsAuth = isAuthenticatedRoute(path, method) || isAdminRoute(path, method);
  if (!needsAuth) return;

  const authHeader =
    getHeader(event, "authorization") || getHeader(event, "Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const token = authHeader.slice(7).trim();
  const config = useRuntimeConfig();
  const decoded = verifyAuthToken(token, config.authTokenSecret);

  if (!decoded || decoded.exp < Math.floor(Date.now() / 1000)) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid token",
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "User not found",
    });
  }

  event.context.user = user;

  if (isAdminRoute(path, method) && !user.isAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: "Admin access required",
    });
  }
});
