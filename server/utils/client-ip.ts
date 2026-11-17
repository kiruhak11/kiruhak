/**
 * Определение адреса клиента с учётом доверенных прокси.
 *
 * Модель доверия (проверена на реальной схеме kiruhak11.ru):
 *
 *   посетитель → Edge (TLS, 81.177.135.137) → nginx (127.0.0.1) →
 *   docker gateway (172.18.0.1) → приложение
 *
 * `nginx` дописывает адрес своего пира в конец `X-Forwarded-For`, поэтому
 * последний элемент цепочки — это Edge, а элемент перед ним — представление
 * Edge о клиенте. Всё, что левее, может быть подделано клиентом.
 *
 * Цепочка принимается только если выполнены два условия:
 *
 *   1. непосредственный пир (адрес сокета) — доверенный прокси;
 *   2. последний хоп цепочки (добавленный этим прокси) — тоже доверенный.
 *
 * Иначе цепочка не доверяется и используется адрес пира: клиент не может
 * назвать себе произвольный адрес. Адрес пира подделать нельзя — он берётся
 * из фактического соединения.
 */

/** Тип события h3: берём из сигнатуры авто-импортированного хелпера. */
type H3EventLike = Parameters<typeof getHeader>[0];

export interface TrustedProxyOptions {
  /** Доверенные прокси (CIDR или IP) через запятую. */
  trustedProxies?: string | readonly string[] | undefined;
}

export interface ParsedProxy {
  address: string;
  prefix: number;
  family: 4 | 6;
}

/** Откуда взят адрес клиента. */
export type ClientAddressSource =
  /** адрес фактического соединения (пир) */
  | "peer"
  /** адрес из цепочки X-Forwarded-For (доверенная цепочка) */
  | "forwarded-chain"
  /** цепочка не прошла проверку доверия — использован пир */
  | "untrusted-chain"
  /** адрес определить не удалось */
  | "unknown";

export interface ClientAddressResolution {
  address: string;
  source: ClientAddressSource;
  /** адрес непосредственного соединения */
  peer?: string;
  /** разобранная цепочка X-Forwarded-For */
  chain: string[];
  /** предупреждение о неверной конфигурации (если есть) */
  warning?: string;
}

/** Значение, когда адрес клиента определить не удалось. */
export const UNKNOWN_CLIENT_ADDRESS = "unknown";

/**
 * Доверенные прокси по умолчанию — только loopback: это сам хост, его адрес
 * подделать нельзя. Приватные подсети и адрес Edge задаются явно через
 * `TRUSTED_PROXY_IPS`.
 */
export const DEFAULT_TRUSTED_PROXIES: readonly string[] = [
  "127.0.0.0/8",
  "::1/128",
];

/** Подсети, которые нельзя использовать как доверенные прокси без доказанной необходимости. */
export const OVERLY_BROAD_TRUSTED_RANGES: readonly string[] = [
  "0.0.0.0/0",
  "::/0",
  "10.0.0.0/8",
  "172.16.0.0/12",
  "192.168.0.0/16",
  "fc00::/7",
];

const IPV4_PATTERN = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

/**
 * Приводит адрес к каноническому виду: убирает порт, квадратные скобки,
 * префикс `::ffff:` и нормализует регистр.
 */
export function normalizeIp(raw: string | null | undefined): string | null {
  if (!raw) return null;

  let value = raw.trim().toLowerCase();
  if (!value) return null;

  if (value.startsWith("[")) {
    const end = value.indexOf("]");
    if (end === -1) return null;
    value = value.slice(1, end);
  } else if (value.includes(":")) {
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
    return value;
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
  value: string | readonly string[] | undefined
): ParsedProxy[] {
  const raw = typeof value === "string" ? value.split(",") : [...(value ?? [])];
  const result: ParsedProxy[] = [];

  for (const entry of raw) {
    const trimmed = entry.trim();
    if (!trimmed) continue;

    const [addressPart, prefixPart] = trimmed.split("/");
    const address = normalizeIp(addressPart);
    if (!address) continue;

    const isV4 = parseIpv4(address) !== null;
    const maxPrefix = isV4 ? 32 : 128;
    const prefix =
      prefixPart !== undefined ? Number.parseInt(prefixPart, 10) : maxPrefix;
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

/** Разбирает цепочку `X-Forwarded-For` в список нормализованных адресов. */
export function parseForwardedChain(
  forwardedFor: string | null | undefined
): string[] {
  if (!forwardedFor) return [];

  return forwardedFor
    .split(",")
    .map((part) => normalizeIp(part))
    .filter((part): part is string => Boolean(part));
}

export interface ClientAddressInput {
  /** Адрес непосредственного соединения (socket.remoteAddress). */
  peer?: string | null;
  /** Значение заголовка X-Forwarded-For. */
  forwardedFor?: string | null;
  /** Разобранный список доверенных прокси. */
  trusted: readonly ParsedProxy[];
}

/**
 * Чистая функция определения адреса клиента.
 *
 * Возвращает не только адрес, но и источник, чтобы вызывающий код мог
 * сообщить о неверной конфигурации доверенных прокси.
 */
export function resolveClientAddress(
  input: ClientAddressInput
): ClientAddressResolution {
  const peer = normalizeIp(input.peer);
  const chain = parseForwardedChain(input.forwardedFor);

  if (!peer) {
    return { address: UNKNOWN_CLIENT_ADDRESS, source: "unknown", chain };
  }

  // Соединение не от доверенного прокси: цепочка игнорируется полностью.
  if (!isTrustedAddress(peer, input.trusted)) {
    return { address: peer, source: "peer", peer, chain };
  }

  if (chain.length === 0) {
    return { address: peer, source: "peer", peer, chain };
  }

  const lastHop = chain[chain.length - 1];

  // Последний хоп добавлен прокси — он должен быть доверенным, иначе цепочку
  // нельзя интерпретировать (клиент мог подмешать свои адреса).
  if (!isTrustedAddress(lastHop, input.trusted)) {
    return {
      address: peer,
      source: "untrusted-chain",
      peer,
      chain,
      warning:
        "цепочка X-Forwarded-For не подтверждена доверенным прокси: использован адрес соединения, все клиенты окажутся за одним адресом",
    };
  }

  for (let index = chain.length - 1; index >= 0; index -= 1) {
    if (!isTrustedAddress(chain[index], input.trusted)) {
      return { address: chain[index], source: "forwarded-chain", peer, chain };
    }
  }

  return {
    address: peer,
    source: "untrusted-chain",
    peer,
    chain,
    warning:
      "вся цепочка X-Forwarded-For состоит из доверенных адресов: использован адрес соединения",
  };
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

/**
 * Определяет адрес клиента по событию h3.
 *
 * Единственная точка входа для всех потребителей: middleware ограничения
 * частоты, доставка заявок, Telegram Login, счётчики просмотров и аналитика.
 */
export function resolveClientIp(
  event: H3EventLike,
  options: TrustedProxyOptions = {}
): ClientAddressResolution {
  // По умолчанию берётся конфигурация окружения: все потребители обязаны
  // считать одного и того же клиента одинаково.
  const configured =
    options.trustedProxies ?? trustedProxiesFromEnv();
  const trusted = parseTrustedProxies([
    ...DEFAULT_TRUSTED_PROXIES,
    ...(typeof configured === "string" ? configured.split(",") : configured),
  ]);

  return resolveClientAddress({
    peer: event.node?.req?.socket?.remoteAddress,
    forwardedFor: event.headers?.get("x-forwarded-for"),
    trusted,
  });
}

export interface TrustedProxyDiagnostics {
  /** Заданы ли доверенные прокси через окружение. */
  configured: boolean;
  /** Итоговый список доверенных адресов. */
  trusted: string[];
  /** Предупреждения о конфигурации. */
  warnings: string[];
}

/**
 * Диагностика конфигурации доверенных прокси.
 *
 * Вызывается при старте приложения, чтобы неверная настройка была замечена
 * до production-деплоя, а не после первых жалоб пользователей.
 */
export function trustedProxyDiagnostics(
  env: Record<string, string | undefined> = process.env,
  defaults: readonly string[] = DEFAULT_TRUSTED_PROXIES
): TrustedProxyDiagnostics {
  const configured = trustedProxiesFromEnv(env);
  const trusted = [...defaults, ...configured];
  const warnings: string[] = [];

  if (configured.length === 0) {
    warnings.push(
      "TRUSTED_PROXY_IPS не задан: цепочка X-Forwarded-For не будет использована, все посетители получат один адрес — форма заявок перестанет работать после нескольких отправок"
    );
  }

  for (const entry of configured) {
    if (OVERLY_BROAD_TRUSTED_RANGES.includes(entry.trim())) {
      warnings.push(
        `TRUSTED_PROXY_IPS содержит слишком широкую подсеть ${entry}: соседние контейнеры на хосте смогут подменять адрес клиента`
      );
    }
  }

  return { configured: configured.length > 0, trusted, warnings };
}
