/**
 * Ограничение частоты запросов к чувствительным маршрутам.
 *
 * Хранилище — процессное: приложение развёрнуто одним инстансом, поэтому
 * общее хранилище (Redis) не требуется и не применяется (Redis в этой
 * инфраструктуре принадлежит другому проекту). Счётчики живут в памяти
 * процесса, имеют окно и автоматически вытесняются.
 *
 * Ограничения:
 * - память ограничена: не более `maxEntries` записей, устаревшие вытесняются;
 * - проверка и увеличение счётчика выполняются синхронно, без await, поэтому
 *   параллельные запросы не могут обойти лимит;
 * - в ответе 429 всегда присутствует корректный `Retry-After`.
 */

export interface RateLimitPolicy {
  /** Сколько запросов разрешено в окне. */
  limit: number;
  /** Длина окна в миллисекундах. */
  windowMs: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Момент окончания текущего окна (epoch ms). */
  resetAt: number;
  /** Через сколько секунд можно повторить запрос. */
  retryAfterSeconds: number;
}

/** Группы маршрутов и их лимиты. */
export const RATE_LIMIT_POLICIES = {
  "auth.login": { limit: 10, windowMs: 15 * 60_000 },
  "auth.telegram": { limit: 10, windowMs: 15 * 60_000 },
  "auth.recovery": { limit: 5, windowMs: 15 * 60_000 },
  "lead.form": { limit: 10, windowMs: 10 * 60_000 },
  "analytics.track": { limit: 60, windowMs: 60_000 },
  "ui.view": { limit: 30, windowMs: 60_000 },
  bot: { limit: 120, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitPolicy>;

export type RateLimitGroup = keyof typeof RATE_LIMIT_POLICIES;

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Правила сопоставления маршрута с группой лимита.
 *
 * Порядок важен: более специфичные правила проверяются первыми.
 */
const RULES: Array<{ group: RateLimitGroup; method: string; match: (path: string) => boolean }> = [
  {
    group: "auth.login",
    method: "POST",
    match: (path) => path === "/api/auth/login",
  },
  {
    group: "auth.telegram",
    method: "POST",
    match: (path) =>
      path === "/api/auth/telegram-login/start" ||
      path === "/api/auth/telegram-login/verify",
  },
  {
    group: "auth.recovery",
    method: "POST",
    match: (path) =>
      path === "/api/auth/recovery/challenge" ||
      path === "/api/auth/recovery/complete",
  },
  {
    group: "lead.form",
    method: "POST",
    match: (path) => path === "/api/telegram",
  },
  {
    group: "analytics.track",
    method: "POST",
    match: (path) =>
      path === "/api/analytics/track" || path === "/api/analytics/track-simple",
  },
  {
    group: "ui.view",
    method: "POST",
    match: (path) => /^\/api\/ui-components\/[^/]+\/view$/.test(path),
  },
  {
    group: "bot",
    method: "POST",
    match: (path) =>
      path.startsWith("/api/bot/") || path === "/api/auth/create-account",
  },
];

/**
 * Возвращает группу лимита для запроса или null, если маршрут не ограничивается.
 *
 * Ограничиваются только изменяющие запросы: публичное чтение, health,
 * robots.txt и статика остаются без лимитов.
 */
export function classifyRateLimitedRoute(
  method: string,
  path: string
): RateLimitGroup | null {
  const upperMethod = method.toUpperCase();

  // CORS preflight не блокируется никогда.
  if (upperMethod === "OPTIONS") return null;
  if (upperMethod !== "POST") return null;

  if (path === "/api/health" || path === "/api/health/db") return null;

  for (const rule of RULES) {
    if (rule.method !== upperMethod) continue;
    if (rule.match(path)) return rule.group;
  }

  return null;
}

export interface RateLimiterOptions {
  /** Максимальное число одновременно хранимых счётчиков. */
  maxEntries?: number;
  /** Функция времени — для детерминированных тестов. */
  now?: () => number;
}

export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  private readonly maxEntries: number;
  private readonly now: () => number;

  constructor(options: RateLimiterOptions = {}) {
    this.maxEntries = Math.max(1, options.maxEntries ?? 10_000);
    this.now = options.now ?? (() => Date.now());
  }

  get size(): number {
    return this.buckets.size;
  }

  reset(): void {
    this.buckets.clear();
  }

  /** Удаляет устаревшие счётчики. Вызывается при переполнении хранилища. */
  sweep(now: number = this.now()): number {
    let removed = 0;
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) {
        this.buckets.delete(key);
        removed += 1;
      }
    }
    return removed;
  }

  private ensureCapacity(now: number): void {
    if (this.buckets.size < this.maxEntries) return;

    this.sweep(now);
    while (this.buckets.size >= this.maxEntries) {
      const oldest = this.buckets.keys().next();
      if (oldest.done) break;
      this.buckets.delete(oldest.value);
    }
  }

  /**
   * Учитывает запрос и возвращает решение.
   *
   * Синхронная операция: между чтением и записью счётчика нет точки
   * ожидания, поэтому конкурентные запросы не могут превысить лимит.
   */
  consume(key: string, policy: RateLimitPolicy): RateLimitDecision {
    const now = this.now();
    this.ensureCapacity(now);

    const existing = this.buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      const resetAt = now + policy.windowMs;
      this.buckets.set(key, { count: 1, resetAt });
      return {
        allowed: true,
        limit: policy.limit,
        remaining: Math.max(0, policy.limit - 1),
        resetAt,
        retryAfterSeconds: 0,
      };
    }

    existing.count += 1;
    const allowed = existing.count <= policy.limit;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((existing.resetAt - now) / 1000)
    );

    return {
      allowed,
      limit: policy.limit,
      remaining: Math.max(0, policy.limit - existing.count),
      resetAt: existing.resetAt,
      retryAfterSeconds,
    };
  }

  /** Текущее состояние счётчика без увеличения. */
  peek(key: string): Bucket | undefined {
    return this.buckets.get(key);
  }
}

/** Процессный лимитер, общий для всех запросов инстанса. */
export const rateLimiter = new RateLimiter();

/** Ключ счётчика: группа + адрес клиента. */
export function rateLimitKey(group: RateLimitGroup, clientAddress: string): string {
  return `${group}:${clientAddress}`;
}
