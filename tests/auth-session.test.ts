import assert from "node:assert/strict";
import { test } from "node:test";
import { useAuth } from "../composables/useAuth";
import type {
  AuthResponse,
  SessionStorage,
  User,
} from "../composables/useAuth";

/**
 * Регрессии восстановления сессии.
 *
 * Инвариант: localStorage — это только хранилище кандидата на токен.
 * Доказательством авторизации является ответ сервера `/api/user/me`.
 */

class MemoryStorage implements SessionStorage {
  private readonly data = new Map<string, string>();

  constructor(initial: Record<string, string> = {}) {
    for (const [key, value] of Object.entries(initial)) {
      this.data.set(key, value);
    }
  }

  getItem(key: string): string | null {
    return this.data.has(key) ? (this.data.get(key) as string) : null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  get keys(): string[] {
    return [...this.data.keys()];
  }
}

const serverUser = (overrides: Partial<User> = {}): User => ({
  id: "user-1",
  telegramId: "100200300",
  username: "kiruhak11",
  firstName: "Kirill",
  lastName: "Kovalenko",
  isAdmin: false,
  balance: 2500,
  sitesCount: 2,
  transactionsCount: 3,
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

const httpError = (status: number, field: "statusCode" | "status" = "statusCode") => {
  const error = new Error(`HTTP ${status}`) as Error & Record<string, number>;
  error[field] = status;
  return error;
};

const networkError = () => new Error("network unreachable");

const authGlobals = globalThis as unknown as {
  $fetch?: (request: string, options?: Record<string, unknown>) => Promise<unknown>;
};

test("valid session survives a reload only after server confirmation", async () => {
  const storage = new MemoryStorage({
    auth_token: "valid-token",
    auth_user: JSON.stringify(serverUser({ isAdmin: false, balance: 0 })),
  });
  const requested: string[] = [];
  const auth = useAuth();

  const result = await auth.initAuth({
    storage,
    fetchUser: async (token) => {
      requested.push(token);
      return { success: true, user: serverUser({ balance: 2500 }) } as AuthResponse;
    },
  });

  assert.equal(result.status, "authenticated");
  assert.equal(auth.isAuthenticated.value, true);
  assert.equal(auth.sessionStatus.value, "authenticated");
  assert.equal(auth.user.value?.balance, 2500);
  assert.deepEqual(requested, ["valid-token"]);
  assert.equal(
    storage.getItem("auth_user"),
    JSON.stringify(serverUser({ balance: 2500 })),
    "в хранилище записывается ответ сервера, а не локальная копия"
  );
});

test("expired token is rejected by the server and the local session is cleared", async () => {
  const storage = new MemoryStorage({
    auth_token: "expired-token",
    auth_user: JSON.stringify(serverUser()),
  });
  const auth = useAuth();

  const result = await auth.initAuth({
    storage,
    fetchUser: async () => {
      throw httpError(401);
    },
  });

  assert.equal(result.status, "anonymous");
  assert.equal(auth.isAuthenticated.value, false);
  assert.equal(auth.isAdmin.value, false);
  assert.equal(auth.sessionStatus.value, "anonymous");
  assert.equal(storage.getItem("auth_token"), null);
  assert.equal(storage.getItem("auth_user"), null);
});

test("revoked session (server answers without a user) is cleared", async () => {
  const storage = new MemoryStorage({
    auth_token: "revoked-token",
    auth_user: JSON.stringify(serverUser()),
  });
  const auth = useAuth();

  const result = await auth.initAuth({
    storage,
    fetchUser: async () => ({ success: false, error: "Unauthorized" }) as AuthResponse,
  });

  assert.equal(result.status, "anonymous");
  assert.equal(auth.isAuthenticated.value, false);
  assert.deepEqual(storage.keys, []);
});

test("forged auth_user with isAdmin=true never grants admin rights", async () => {
  const forged = serverUser({ id: "attacker", isAdmin: true, balance: 999_999 });
  const storage = new MemoryStorage({
    auth_token: "forged-token",
    auth_user: JSON.stringify(forged),
  });
  const auth = useAuth();

  // Сервер отвергает токен — подделанные права не должны пережить проверку.
  const result = await auth.initAuth({
    storage,
    fetchUser: async () => {
      throw httpError(401);
    },
  });

  assert.equal(result.status, "anonymous");
  assert.equal(auth.isAuthenticated.value, false);
  assert.equal(auth.isAdmin.value, false);
  assert.notEqual(auth.user.value?.id, "attacker");
  assert.equal(storage.getItem("auth_user"), null);
});

test("forged auth_user is replaced by the server-confirmed user", async () => {
  const forged = serverUser({ id: "attacker", isAdmin: true });
  const storage = new MemoryStorage({
    auth_token: "token-with-admin-claim",
    auth_user: JSON.stringify(forged),
  });
  const auth = useAuth();

  const result = await auth.initAuth({
    storage,
    fetchUser: async () => ({
      success: true,
      user: serverUser({ isAdmin: false }),
    }) as AuthResponse,
  });

  assert.equal(result.status, "authenticated");
  assert.equal(auth.isAdmin.value, false, "права администратора берутся с сервера");
  assert.equal(auth.user.value?.id, "user-1");
});

test("malformed JWT is rejected and cleared", async () => {
  const storage = new MemoryStorage({
    auth_token: "not.a.jwt",
    auth_user: JSON.stringify(serverUser()),
  });
  const auth = useAuth();

  const result = await auth.initAuth({
    storage,
    fetchUser: async () => {
      throw httpError(401, "status");
    },
  });

  assert.equal(result.status, "anonymous");
  assert.equal(auth.isAuthenticated.value, false);
  assert.equal(storage.getItem("auth_token"), null);
});

test("temporary API outage does not confirm the session but keeps a retry possible", async () => {
  const storage = new MemoryStorage({
    auth_token: "flaky-token",
    auth_user: JSON.stringify(serverUser({ isAdmin: true })),
  });
  const auth = useAuth();
  let attempt = 0;

  const result = await auth.initAuth({
    storage,
    fetchUser: async () => {
      attempt += 1;
      if (attempt === 1) throw networkError();
      return { success: true, user: serverUser() } as AuthResponse;
    },
  });

  assert.equal(result.status, "unverified");
  assert.equal(auth.isAuthenticated.value, false, "неподтверждённый пользователь не авторизован");
  assert.equal(auth.isAdmin.value, false);
  assert.equal(
    storage.getItem("auth_token"),
    "flaky-token",
    "при сетевой ошибке хранилище не уничтожается — возможен повтор"
  );

  const retry = await auth.retrySessionValidation();

  assert.equal(retry.status, "authenticated");
  assert.equal(auth.isAuthenticated.value, true);
  assert.equal(auth.user.value?.id, "user-1");
});

test("logout revokes the server session and clears local storage", async () => {
  const storage = new MemoryStorage({
    auth_token: "logout-token",
    auth_user: JSON.stringify(serverUser()),
  });
  const auth = useAuth();
  const logoutCalls: Array<Record<string, unknown>> = [];

  authGlobals.$fetch = async (request: string, options?: Record<string, unknown>) => {
    logoutCalls.push({ request, ...(options ?? {}) });
    return { success: true };
  };

  try {
    await auth.initAuth({
      storage,
      fetchUser: async () => ({ success: true, user: serverUser() }) as AuthResponse,
    });

    assert.equal(auth.isAuthenticated.value, true);

    const result = await auth.logout();

    assert.equal(result.serverRevoked, true);
    assert.equal(result.localCleared, true);
    assert.equal(auth.isAuthenticated.value, false);
    assert.equal(auth.user.value, null);
    assert.equal(auth.token.value, null);
    assert.deepEqual(storage.keys, []);
    assert.equal(logoutCalls.length, 1);
    assert.equal(logoutCalls[0].request, "/api/auth/logout");
    assert.deepEqual(logoutCalls[0].headers, { Authorization: "Bearer logout-token" });
  } finally {
    delete authGlobals.$fetch;
  }
});

test("parallel initAuth calls issue a single server request", async () => {
  const storage = new MemoryStorage({ auth_token: "single-flight-token" });
  const auth = useAuth();
  let requests = 0;

  const fetchUser = async () => {
    requests += 1;
    await new Promise((resolve) => setTimeout(resolve, 5));
    return { success: true, user: serverUser() } as AuthResponse;
  };

  const [first, second] = await Promise.all([
    auth.initAuth({ storage, fetchUser }),
    auth.initAuth({ storage, fetchUser }),
  ]);

  assert.equal(requests, 1, "параллельные вызовы не должны плодить запросы");
  assert.equal(first.status, "authenticated");
  assert.equal(second.status, "authenticated");
});

test("a session without a stored token is treated as anonymous", async () => {
  const storage = new MemoryStorage();
  const auth = useAuth();
  let requests = 0;

  const result = await auth.initAuth({
    storage,
    fetchUser: async () => {
      requests += 1;
      return { success: true, user: serverUser() } as AuthResponse;
    },
  });

  assert.equal(result.status, "anonymous");
  assert.equal(requests, 0, "без токена сервер не опрашивается");
  assert.equal(auth.isAuthenticated.value, false);
});
