import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

/**
 * Регрессии оркестрации релиза.
 *
 * Проверяется `ops/release-orchestration.sh`: health-гейт, блокирующий
 * post-deploy smoke и автоматический откат. Живой production не затрагивается:
 * Docker подменён заглушкой, HTTP-смоуки — заглушками с задаваемым кодом
 * возврата.
 */

const SCRIPT = fileURLToPath(new URL("../ops/release-orchestration.sh", import.meta.url));

const CONTAINER = "kiruhak_app";
const NEW_IMAGE_ID = "sha256:3819f38f9ce9b72bc2c59a7fd2e168f211df5aa91743e76529be0bc8ed248534";
const OLD_IMAGE_ID = "sha256:245d1e23bcbda156ab70d9807a902887ad60b257977f72c333317e8012bf745b";

const DOCKER_STUB = [
  "#!/usr/bin/env bash",
  "# Заглушка Docker: состояние контейнера задаётся файлами в каталоге state.",
  'STATE_DIR="__STATE_DIR__"',
  "",
  'case "$1" in',
  "  inspect)",
  '    running="$(cat "${STATE_DIR}/running" 2>/dev/null || echo running)"',
  '    [ -n "${running}" ] || exit 1',
  '    case "${4}" in',
  '      "{{.State.Status}}") printf \'%s\\n\' "${running}" ;;',
  '      "{{.State.Health.Status}}") cat "${STATE_DIR}/health" 2>/dev/null || echo starting ;;',
  '      "{{.Image}}") cat "${STATE_DIR}/image_id" 2>/dev/null || echo "" ;;',
  '      "{{.Id}}") echo "stub-container-id" ;;',
  '      *) echo "" ;;',
  "    esac",
  "    ;;",
  "  image)",
  '    if grep -qxF "${3}" "${STATE_DIR}/images" 2>/dev/null; then',
  '      echo "[]"',
  "      exit 0",
  "    fi",
  "    exit 1",
  "    ;;",
  "  compose)",
  '    printf \'%s\\n\' "$*" >> "${STATE_DIR}/compose.log"',
  "    # Откат возвращает прежний образ в рабочее состояние.",
  '    if printf \'%s\\n\' "$*" | grep -q rollback; then',
  '      cat "${STATE_DIR}/rollback_image_id" > "${STATE_DIR}/image_id" 2>/dev/null || true',
  '      echo healthy > "${STATE_DIR}/health"',
  '      echo running > "${STATE_DIR}/running"',
  "    fi",
  "    ;;",
  "  *)",
  "    ;;",
  "esac",
  "exit 0",
  "",
].join("\n");

const SMOKE_STUB = [
  "#!/usr/bin/env bash",
  'echo "$0" >> "__STATE_DIR__/smoke.called"',
  'exit "${__EXIT_VAR__:-0}"',
  "",
].join("\n");

type Scenario = {
  health?: string;
  running?: string;
  imageId?: string;
  images?: string[];
  prodExit?: number;
  securityExit?: number;
  rollbackExit?: number;
  rollbackOverride?: boolean;
  healthTimeout?: number;
};

type Result = {
  code: number;
  stdout: string;
  state: Record<string, string>;
  composeLog: string;
  smokeCalled: string[];
};

const hasBash = (): boolean => {
  try {
    execFileSync("bash", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};

const runScenario = (scenario: Scenario): Result => {
  const root = mkdtempSync(join(tmpdir(), "kstudio-orchestration-"));
  const bin = join(root, "bin");
  const state = join(root, "state");
  const composeDir = join(root, "compose");
  mkdirSync(bin, { recursive: true });
  mkdirSync(state, { recursive: true });
  mkdirSync(composeDir, { recursive: true });

  const dockerStub = join(bin, "docker");
  writeFileSync(dockerStub, DOCKER_STUB.replace("__STATE_DIR__", state), { mode: 0o755 });
  chmodSync(dockerStub, 0o755);

  const smokes: Record<string, string> = {};
  const exitVars: Record<string, string> = {
    "smoke-prod.sh": "SMOKE_PROD_EXIT",
    "smoke-security.sh": "SMOKE_SECURITY_EXIT",
    "smoke-rollback.sh": "SMOKE_ROLLBACK_EXIT",
  };
  for (const name of Object.keys(exitVars)) {
    const file = join(bin, name);
    writeFileSync(
      file,
      SMOKE_STUB.replace("__STATE_DIR__", state).replace("__EXIT_VAR__", exitVars[name]),
      { mode: 0o755 }
    );
    chmodSync(file, 0o755);
    smokes[name] = file;
  }

  writeFileSync(join(state, "health"), scenario.health ?? "healthy");
  writeFileSync(join(state, "running"), scenario.running ?? "running");
  writeFileSync(join(state, "image_id"), scenario.imageId ?? NEW_IMAGE_ID);
  writeFileSync(join(state, "rollback_image_id"), OLD_IMAGE_ID);
  writeFileSync(
    join(state, "images"),
    (scenario.images ?? [NEW_IMAGE_ID, OLD_IMAGE_ID]).join("\n") + "\n"
  );

  const override = join(root, "api-fail-closed-20261115-rollback.yml");
  if (scenario.rollbackOverride !== false) {
    writeFileSync(override, "services:\n  app:\n    image: kiruhak-app:api-fail-closed-20261115\n");
  }

  const stateFile = join(root, "release.state");
  const logFile = join(root, "release.log");

  const result = spawnSync(
    "bash",
    [
      SCRIPT,
      "--release",
      "security-headers-rate-limit-20261117",
      "--container",
      CONTAINER,
      "--expected-image-id",
      NEW_IMAGE_ID,
      "--rollback-image-id",
      OLD_IMAGE_ID,
      "--rollback-override",
      override,
      "--compose-dir",
      composeDir,
      "--project",
      "kiruhak",
      "--compose-file",
      join(composeDir, "docker-compose.prod.yml"),
      "--state-file",
      stateFile,
      "--log-file",
      logFile,
      "--health-timeout",
      String(scenario.healthTimeout ?? 2),
      "--smoke-production",
      smokes["smoke-prod.sh"],
      "--smoke-security",
      smokes["smoke-security.sh"],
      "--smoke-rollback",
      smokes["smoke-rollback.sh"],
      "--smoke-base-url",
      "http://127.0.0.1:9",
    ],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${bin}:${process.env.PATH ?? ""}`,
        SMOKE_PROD_EXIT: String(scenario.prodExit ?? 0),
        SMOKE_SECURITY_EXIT: String(scenario.securityExit ?? 0),
        SMOKE_ROLLBACK_EXIT: String(scenario.rollbackExit ?? 0),
      },
    }
  );

  // Коды возврата заглушек смоуков различаются по сценарию: отдельный прогон
  // на каждый набор не нужен — заглушка читает код из своего файла.
  return {
    code: result.status ?? -1,
    stdout: `${result.stdout ?? ""}${result.stderr ?? ""}`,
    state: readState(stateFile),
    composeLog: readIfExists(join(state, "compose.log")),
    smokeCalled: readIfExists(join(state, "smoke.called"))
      .split("\n")
      .filter(Boolean),
  };
};

const readIfExists = (file: string): string => {
  try {
    return readFileSync(file, "utf8");
  } catch {
    return "";
  }
};

const readState = (file: string): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const line of readIfExists(file).split("\n")) {
    const index = line.indexOf("=");
    if (index > 0) out[line.slice(0, index)] = line.slice(index + 1);
  }
  return out;
};

const bashAvailable = hasBash();

test("release orchestration: bash доступен для запуска скриптов оркестрации", () => {
  assert.ok(
    bashAvailable,
    "регрессии оркестрации требуют bash (apt-get install bash / apk add bash)"
  );
});

test(
  "health остаётся starting до таймаута — релиз провален, прежний образ возвращён",
  { skip: !bashAvailable },
  () => {
    const result = runScenario({ health: "starting", healthTimeout: 2 });

    assert.notEqual(result.code, 0, "релиз с нездоровым контейнером не может быть успешным");
    assert.equal(result.state.state, "ROLLED_BACK");
    assert.equal(result.state.failed_check, "docker-health");
    assert.match(result.state.error ?? "", /timeout/);
    assert.match(result.composeLog, /rollback/, "откат должен быть выполнен");
    assert.doesNotMatch(result.stdout, /RELEASE VERIFIED/);
  }
);

test(
  "health становится unhealthy — релиз провален, прежний образ возвращён",
  { skip: !bashAvailable },
  () => {
    const result = runScenario({ health: "unhealthy", healthTimeout: 5 });

    assert.notEqual(result.code, 0);
    assert.equal(result.state.state, "ROLLED_BACK");
    assert.equal(result.state.failed_check, "docker-health");
    assert.match(result.state.health_result ?? "", /unhealthy/);
    assert.match(result.composeLog, /rollback/);
  }
);

test(
  "production smoke возвращает exit 1 — релиз провален, имя упавшей проверки сохранено",
  { skip: !bashAvailable },
  () => {
    const result = runScenario({ prodExit: 1 });

    assert.notEqual(result.code, 0);
    assert.equal(result.state.state, "ROLLED_BACK");
    assert.equal(result.state.failed_check, "verify-production.sh");
    assert.match(result.state.error ?? "", /verify-production\.sh/);
    assert.match(result.composeLog, /rollback/);
  }
);

test(
  "security smoke возвращает exit 1 — релиз провален, откат не требует новых заголовков",
  { skip: !bashAvailable },
  () => {
    const result = runScenario({ securityExit: 1 });

    assert.notEqual(result.code, 0);
    assert.equal(result.state.state, "ROLLED_BACK");
    assert.equal(result.state.failed_check, "verify-security-headers.sh");
    assert.match(result.composeLog, /rollback/);
    // Прежний образ не умеет отдавать новые security-заголовки: проверка
    // отката не должна их требовать, иначе откат был бы невозможен.
    assert.match(
      result.smokeCalled.join(" "),
      /smoke-rollback\.sh/,
      "откат проверяется базовым смоуком"
    );
  }
);

test(
  "все проверки проходят — релиз верифицирован, откат не выполняется",
  { skip: !bashAvailable },
  () => {
    const result = runScenario({});

    assert.equal(result.code, 0, result.stdout);
    assert.equal(result.state.state, "VERIFIED");
    assert.equal(result.state.rollback, "not-needed");
    assert.equal(result.composeLog, "", "откат не должен выполняться при успешном релизе");
    assert.match(result.stdout, /RELEASE VERIFIED/);
  }
);

test(
  "контейнер работает на неожиданном image ID — релиз провален",
  { skip: !bashAvailable },
  () => {
    const result = runScenario({ imageId: OLD_IMAGE_ID, healthTimeout: 2 });

    assert.notEqual(result.code, 0);
    assert.equal(result.state.state, "ROLLED_BACK");
    assert.match(result.state.health_result ?? "", /unexpected-image-id/);
  }
);

test(
  "контейнер исчез — релиз провален",
  { skip: !bashAvailable },
  () => {
    const result = runScenario({ running: "", healthTimeout: 2 });

    assert.notEqual(result.code, 0);
    assert.equal(result.state.state, "ROLLED_BACK");
    assert.match(result.state.health_result ?? "", /container-missing/);
  }
);

test(
  "образ отката отсутствует локально — BLOCKER, переключение не скрывается",
  { skip: !bashAvailable },
  () => {
    const result = runScenario({ health: "unhealthy", images: [NEW_IMAGE_ID], healthTimeout: 2 });

    assert.equal(result.code, 2, "невозможный откат — это блокер, а не провал");
    assert.equal(result.state.state, "BLOCKED");
    assert.match(result.state.error ?? "", /not available locally/);
    assert.doesNotMatch(result.stdout, /RELEASE VERIFIED/);
  }
);

test(
  "rollback-override отсутствует — BLOCKER, откат не выполняется молча",
  { skip: !bashAvailable },
  () => {
    const result = runScenario({
      health: "unhealthy",
      rollbackOverride: false,
      healthTimeout: 2,
    });

    assert.equal(result.code, 2);
    assert.equal(result.state.state, "BLOCKED");
    assert.match(result.state.error ?? "", /rollback override missing/);
    assert.doesNotMatch(result.composeLog, /up -d/, "переключение не должно выполняться");
  }
);
