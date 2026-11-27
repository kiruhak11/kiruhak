/**
 * Политика авторизации API K-Studio.
 *
 * Ключевой принцип — FAIL-CLOSED: любой маршрут `/api/**`, который не описан
 * явно в таблице ниже, ДОСТУПЕН НЕ ДОЛЖЕН. Раньше middleware пропускал все
 * неизвестные `/api/**` (fail-open), из-за чего новый endpoint без записи в
 * политике автоматически становился публичным.
 *
 * Классификация маршрутов:
 *  - public      — доступен без авторизации;
 *  - user        — требует валидный Bearer-токен пользователя;
 *  - admin       — требует валидный Bearer-токен администратора;
 *  - bot         — служебный API бота, требует корректный x-bot-secret;
 *  - method-not-allowed — путь известен, но HTTP-метод не разрешён;
 *  - unknown     — путь не описан в таблице: запрос отклоняется (404).
 *
 * Решение принимается с учётом HTTP-метода: один и тот же путь может быть
 * публичным для GET и административным для POST.
 */

export type ApiRoutePolicy = "public" | "user" | "admin" | "bot";

export type ApiRouteDecision =
  | { kind: "allow"; policy: ApiRoutePolicy }
  | { kind: "method-not-allowed" }
  | { kind: "unknown" };

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

interface RouteRule {
  /** Методы, для которых правило применяется. */
  methods: HttpMethod[];
  /** Политика доступа для этих методов. */
  policy: ApiRoutePolicy;
  /** Точный шаблон пути (без query-строки). */
  pattern: RegExp;
}

const GET: HttpMethod[] = ["GET", "HEAD"];
const POST: HttpMethod[] = ["POST"];
const WRITE: HttpMethod[] = ["PUT", "PATCH", "DELETE"];

/**
 * Полная таблица API-маршрутов.
 *
 * Порядок правил не важен: все шаблоны якорные (`^...$`) и не пересекаются
 * по числу сегментов, поэтому более специфичные пути не перехватываются
 * общими шаблонами.
 */
export const API_ROUTE_TABLE: RouteRule[] = [
  // --- Публичное чтение -------------------------------------------------
  { methods: GET, policy: "public", pattern: /^\/api\/health$/ },
  { methods: GET, policy: "public", pattern: /^\/api\/projects$/ },
  { methods: GET, policy: "public", pattern: /^\/api\/projects\/[^/]+$/ },
  { methods: GET, policy: "public", pattern: /^\/api\/__sitemap__\/portfolio$/ },
  { methods: GET, policy: "public", pattern: /^\/api\/tutorials$/ },
  { methods: GET, policy: "public", pattern: /^\/api\/tutorials\/[^/]+$/ },
  { methods: GET, policy: "public", pattern: /^\/api\/materials$/ },
  { methods: GET, policy: "public", pattern: /^\/api\/materials\/[^/]+$/ },
  { methods: GET, policy: "public", pattern: /^\/api\/ui-components$/ },
  { methods: POST, policy: "public", pattern: /^\/api\/ui-components\/[^/]+\/view$/ },
  { methods: POST, policy: "public", pattern: /^\/api\/analytics\/track$/ },
  { methods: POST, policy: "public", pattern: /^\/api\/analytics\/track-simple$/ },
  // Идентификатор сайта для собственной аналитики: значение публичное,
  // маршрут только отдаёт его и ничего не принимает.
  { methods: GET, policy: "public", pattern: /^\/api\/analytics\/config$/ },
  { methods: POST, policy: "public", pattern: /^\/api\/telegram$/ },

  // --- Публичная авторизация и Telegram Login ---------------------------
  { methods: POST, policy: "public", pattern: /^\/api\/auth\/login$/ },
  { methods: POST, policy: "public", pattern: /^\/api\/auth\/telegram$/ },
  { methods: POST, policy: "public", pattern: /^\/api\/auth\/telegram-login\/start$/ },
  { methods: GET, policy: "public", pattern: /^\/api\/auth\/telegram-login\/status$/ },
  { methods: POST, policy: "public", pattern: /^\/api\/auth\/telegram-login\/verify$/ },
  { methods: GET, policy: "public", pattern: /^\/api\/auth\/recovery\/telegram-callback$/ },

  // --- Аутентифицированный пользователь ---------------------------------
  { methods: [...GET, ...WRITE, ...POST], policy: "user", pattern: /^\/api\/user\/[^/]+$/ },
  { methods: [...GET, ...POST], policy: "user", pattern: /^\/api\/sites$/ },
  { methods: POST, policy: "user", pattern: /^\/api\/brief$/ },
  { methods: GET, policy: "user", pattern: /^\/api\/analytics\/stats$/ },
  { methods: POST, policy: "user", pattern: /^\/api\/telegram\/check-subscription$/ },
  { methods: POST, policy: "user", pattern: /^\/api\/ui-components\/submit$/ },
  { methods: POST, policy: "user", pattern: /^\/api\/materials\/[^/]+\/rate$/ },
  { methods: POST, policy: "user", pattern: /^\/api\/materials\/[^/]+\/download$/ },
  { methods: GET, policy: "user", pattern: /^\/api\/materials\/[^/]+\/download-pdf$/ },
  { methods: GET, policy: "user", pattern: /^\/api\/materials\/[^/]+\/download-pdf-simple$/ },
  { methods: POST, policy: "user", pattern: /^\/api\/tutorials\/[^/]+\/complete$/ },
  { methods: POST, policy: "user", pattern: /^\/api\/tutorials\/[^/]+\/complete-step$/ },
  { methods: POST, policy: "user", pattern: /^\/api\/auth\/logout$/ },
  { methods: POST, policy: "user", pattern: /^\/api\/auth\/recovery\/challenge$/ },
  { methods: POST, policy: "user", pattern: /^\/api\/auth\/recovery\/complete$/ },

  // --- Административные маршруты ----------------------------------------
  { methods: [...GET, ...POST, ...WRITE], policy: "admin", pattern: /^\/api\/admin(?:\/.*)?$/ },
  { methods: GET, policy: "admin", pattern: /^\/api\/analytics\/overview$/ },
  { methods: POST, policy: "admin", pattern: /^\/api\/projects$/ },
  { methods: WRITE, policy: "admin", pattern: /^\/api\/projects\/[^/]+$/ },
  { methods: POST, policy: "admin", pattern: /^\/api\/materials$/ },
  { methods: WRITE, policy: "admin", pattern: /^\/api\/materials\/[^/]+$/ },
  { methods: POST, policy: "admin", pattern: /^\/api\/tutorials$/ },
  { methods: WRITE, policy: "admin", pattern: /^\/api\/tutorials\/[^/]+$/ },
  { methods: POST, policy: "admin", pattern: /^\/api\/ui-components$/ },
  { methods: WRITE, policy: "admin", pattern: /^\/api\/ui-components\/[^/]+$/ },
  { methods: POST, policy: "admin", pattern: /^\/api\/ui-components\/[^/]+\/moderate$/ },

  // --- Служебный API бота (внутренний, требует x-bot-secret) -------------
  { methods: POST, policy: "bot", pattern: /^\/api\/bot\/[^/]+$/ },
  { methods: POST, policy: "bot", pattern: /^\/api\/auth\/create-account$/ },
  { methods: POST, policy: "bot", pattern: /^\/api\/ui-components\/[^/]+\/bot-moderate$/ },
];

/**
 * Определяет политику доступа для маршрута с учётом HTTP-метода.
 *
 * Неизвестный путь или неподдерживаемый метод НИКОГДА не возвращают
 * `allow` — это и есть fail-closed поведение.
 */
export function classifyApiRoute(path: string, method: string): ApiRouteDecision {
  const normalizedMethod = method.toUpperCase() as HttpMethod;
  let pathIsKnown = false;

  for (const rule of API_ROUTE_TABLE) {
    if (!rule.pattern.test(path)) continue;
    pathIsKnown = true;
    if (rule.methods.includes(normalizedMethod)) {
      return { kind: "allow", policy: rule.policy };
    }
  }

  return pathIsKnown
    ? { kind: "method-not-allowed" }
    : { kind: "unknown" };
}

/** Публичный маршрут: доступен без авторизации. */
export function isPublicApiRoute(path: string, method: string): boolean {
  const decision = classifyApiRoute(path, method);
  return decision.kind === "allow" && decision.policy === "public";
}

/** Маршрут, требующий авторизации пользователя (включая административные). */
export function isAuthenticatedRoute(path: string, method: string): boolean {
  const decision = classifyApiRoute(path, method);
  return (
    decision.kind === "allow" && (decision.policy === "user" || decision.policy === "admin")
  );
}

/** Служебный маршрут бота: требует подтверждённого секрета, а не сессии. */
export function isBotInternalRoute(path: string, method: string): boolean {
  const decision = classifyApiRoute(path, method);
  return decision.kind === "allow" && decision.policy === "bot";
}

/** Административный маршрут: требует прав администратора. */
export function isAdminApiRoute(path: string, method: string): boolean {
  const decision = classifyApiRoute(path, method);
  return decision.kind === "allow" && decision.policy === "admin";
}

export function isValidMaterialId(id: unknown): id is string {
  return typeof id === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(id);
}
