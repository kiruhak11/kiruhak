/**
 * Определение адреса клиента с учётом доверенных прокси.
 *
 * Прямое доверие к `X-Forwarded-For` недопустимо: клиент может подставить
 * любой адрес и таким образом обойти ограничение частоты запросов. Поэтому
 * forwarded-заголовки читаются только тогда, когда соединение пришло от
 * доверенного прокси, а из цепочки выбирается **самый правый недоверенный**
 * адрес: всё, что левее него, мог добавить сам клиент.
 *
 * Типовая схема продакшена:
 *
 *   клиент → Edge (TLS) → nginx (127.0.0.1) → приложение
 *
 * `nginx` дописывает адрес своего пира в конец цепочки, поэтому адрес Edge
 * должен быть в списке доверенных, иначе все посетители попадут в один
 * счётчик. Список задаётся переменной окружения `TRUSTED_PROXY_IPS`.
 */

export interface ClientIpEvent {
  headers?: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string | undefined };
}

export interface TrustedProxyOptions {
  /** Дополнительные доверенные прокси (CIDR или IP), через запятую. */
  trustedProxies?: string | string[] | undefined;
}

export interface ParsedProxy {
  address: string;
  prefix: number;
  family: 4 | 6;
}

/**
 * Адреса, которые считаются доверенными по умолчанию — только loopback.
 *
 * Приватные сети намеренно НЕ доверены: любой соседний контейнер на хосте
 * (в том числе контейнеры другого проекта) иначе смог бы подменить адрес
 * клиента в `X-Forwarded-For` и обойти ограничение частоты запросов.
 * Edge-провайдер и приватные прокси добавляются через `TRUSTED_PROXY_IPS`.
 */
export const DEFAULT_TRUSTED_PROXIES: readonly string[] = [
  "127.0.0.0/8",
  "::1/128",
];

/** Значение, когда адрес клиента определить не удалось. */
export const UNKNOWN_CLIENT_ADDRESS = "unknown";

const IPV4_PATTERN = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

/**
 * Приводит адрес к каноническому виду: убирает порт, квадратные скобки,
 * префикс `::ffff:` и нормализует регистр.
 */
export function normalizeIp(raw: string | null | undefined): string | null {
  if (!raw) return null;

  let value = raw.trim().toLowerCase();
  if (!value) return null;

  // IPv6 в квадратных скобках: [::1]:443
  if (value.startsWith("[")) {
    const end = value.indexOf("]");
    if (end === -1) return null;
    value = value.slice(1, end);
  } else if (value.includes(":")) {
    // IPv4 с портом: 203.0.113.7:443
    const parts = value.split(":");
    if (parts.length === 2 && IPV4_PATTERN.test(parts[0])) {
      value = parts[0];
    }
  }

  if (value.startsWith("::ffff:") && IPV4_PATTERN.test(value.slice(7))) {
    value = value.slice(7);
  }

  if (IPV4_PATTERN.test(value)) {
    const octets = value.split(".").map(Number);
    if (octets.some((octet) => octet > 255)) return null;
    return octets.join(".");
  }

  if (value.includes(":")) {
    return value; // IPv6 — проверяется разбором
  }

  return null;
}

const parseIpv4 = (ip: string): number | null => {
  const match = IPV4_PATTERN.exec(ip);
  if (!match) return null;
  const octets = match.slice(1).map(Number);
  if (octets.some((octet) => octet > 255)) return null;
  return (
    ((octets[0] << 24) >>> 0) +
    (octets[1] << 16) +
    (octets[2] << 8) +
    octets[3]
  ) >>> 0;
};

/** Разворачивает IPv6 в восемь 16-битных групп. */
const parseIpv6 = (ip: string): number[] | null => {
  if (!ip.includes(":")) return null;

  const [head, tail] = ip.split("::");
  const headParts = head ? head.split(":").filter(Boolean) : [];
  const tailParts = tail !== undefined && tail ? tail.split(":").filter(Boolean) : [];

  if (tail === undefined && headParts.length !== 8) return null;
  if (headParts.length + tailParts.length > 8) return null;

  const groups: number[] = [];
  for (const part of headParts) {
    const value = Number.parseInt(part, 16);
    if (!Number.isFinite(value) || value < 0 || value > 0xffff) return null;
    groups.push(value);
  }
  for (let i = headParts.length + tailParts.length; i < 8; i += 1) {
    groups.push(0);
  }
  for (const part of tailParts) {
    const value = Number.parseInt(part, 16);
    if (!Number.isFinite(value) || value < 0 || value > 0xffff) return null;
    groups.push(value);
  }
  return groups;
};

/** Разбирает список доверенных прокси: `ip` или `ip/prefix`. */
export function parseTrustedProxies(
  value: string | string[] | undefined
): ParsedProxy[] {
  const raw = Array.isArray(value) ? value : (value ?? "").split(",");
  const result: ParsedProxy[] = [];

  for (const entry of raw) {
    const trimmed = entry.trim();
    if (!trimmed) continue;

    const [addressPart, prefixPart] = trimmed.split("/");
    const address = normalizeIp(addressPart);
    if (!address) continue;

    const isV4 = parseIpv4(address) !== null;
    const maxPrefix = isV4 ? 32 : 128;
    const prefix = prefixPart !== undefined ? Number.parseInt(prefixPart, 10) : maxPrefix;
    if (!Number.isInteger(prefix) || prefix < 0 || prefix > maxPrefix) continue;

    result.push({ address, prefix, family: isV4 ? 4 : 6 });
  }

  return result;
}

const ipv4InCidr = (ip: string, proxy: ParsedProxy): boolean => {
  const value = parseIpv4(ip);
  if (value === null) return false;
  const base = parseIpv4(proxy.address);
  if (base === null) return false;
  if (proxy.prefix === 0) return true;
  const mask = (0xffffffff << (32 - proxy.prefix)) >>> 0;
  return (value & mask) === (base & mask);
};

const ipv6InCidr = (ip: string, proxy: ParsedProxy): boolean => {
  const value = parseIpv6(ip);
  const base = parseIpv6(proxy.address);
  if (!value || !base) return false;
  if (proxy.prefix === 0) return true;

  const fullGroups = Math.floor(proxy.prefix / 16);
  const restBits = proxy.prefix % 16;

  for (let i = 0; i < fullGroups; i += 1) {
    if (value[i] !== base[i]) return false;
  }
  if (restBits === 0) return true;

  const mask = (0xffff << (16 - restBits)) & 0xffff;
  return (value[fullGroups] & mask) === (base[fullGroups] & mask);
};

/** Проверяет, входит ли адрес в список доверенных прокси. */
export function isTrustedAddress(
  ip: string | null | undefined,
  trusted: readonly ParsedProxy[]
): boolean {
  if (!ip) return false;
  const address = normalizeIp(ip);
  if (!address) return false;

  return trusted.some((proxy) =>
    proxy.family === 4 ? ipv4InCidr(address, proxy) : ipv6InCidr(address, proxy)
  );
}

const readHeader = (
  event: ClientIpEvent,
  name: string
): string | undefined => {
  const headers = event.headers as
    | Record<string, string | string[] | undefined>
    | { get?: (key: string) => string | null }
    | undefined;
  if (!headers) return undefined;

  if (typeof (headers as { get?: unknown }).get === "function") {
    const value = (headers as { get: (key: string) => string | null }).get(name);
    return value ?? undefined;
  }

  const record = headers as Record<string, string | string[] | undefined>;
  const value = record[name] ?? record[name.toLowerCase()];
  if (Array.isArray(value)) return value[0];
  return value;
};

/**
 * Возвращает адрес клиента.
 *
 * Если соединение пришло не от доверенного прокси, forwarded-заголовки
 * игнорируются полностью — иначе клиент подменял бы свой адрес.
 */
export function resolveClientIp(
  event: ClientIpEvent,
  options: TrustedProxyOptions = {}
): string {
  const trusted = parseTrustedProxies([
    ...DEFAULT_TRUSTED_PROXIES,
    ...(Array.isArray(options.trustedProxies)
      ? options.trustedProxies
      : (options.trustedProxies ?? "").split(",")),
  ]);

  const peer = normalizeIp(event.socket?.remoteAddress ?? null);
  if (!peer) return UNKNOWN_CLIENT_ADDRESS;

  if (!isTrustedAddress(peer, trusted)) {
    return peer;
  }

  const chain = (readHeader(event, "x-forwarded-for") ?? "")
    .split(",")
    .map((part) => normalizeIp(part))
    .filter((part): part is string => Boolean(part));

  if (chain.length === 0) {
    return peer;
  }

  // Идём справа налево: адрес, добавленный последним доверенным прокси,
  // является настоящим адресом клиента. Всё, что левее, мог прислать клиент.
  for (let index = chain.length - 1; index >= 0; index -= 1) {
    if (!isTrustedAddress(chain[index], trusted)) {
      return chain[index];
    }
  }

  return chain[0];
}

/** Читает доверенные прокси из окружения. */
export function trustedProxiesFromEnv(
  env: Record<string, string | undefined> = process.env
): string[] {
  return (env.TRUSTED_PROXY_IPS ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}
