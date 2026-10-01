#!/usr/bin/env python3
"""Send a compact daily Docker and website health report to Telegram."""

from __future__ import annotations

import html
import json
import os
import shutil
import socket
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from zoneinfo import ZoneInfo


BARNAUL = ZoneInfo("Asia/Barnaul")
TELEGRAM_LIMIT = 4096


def run(command: list[str], timeout: int = 12) -> str:
    result = subprocess.run(command, check=True, capture_output=True, text=True, timeout=timeout)
    return result.stdout.strip()


def docker_snapshot() -> tuple[list[dict], dict[str, tuple[str, str, str]], str | None]:
    try:
        rows = [json.loads(line) for line in run(["docker", "ps", "-a", "--no-trunc", "--format", "{{json .}}"] ).splitlines() if line]
        names = [row["Names"] for row in rows]
        inspected = json.loads(run(["docker", "inspect", *names], timeout=20)) if names else []
        by_name = {item["Name"].lstrip("/"): item for item in inspected}
        stats: dict[str, tuple[str, str, str]] = {}
        try:
            output = run(["docker", "stats", "--no-stream", "--format", "{{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"], timeout=20)
            for line in output.splitlines():
                name, cpu, memory, mem_percent = line.split("\t", 3)
                stats[name] = (cpu, memory, mem_percent)
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired, ValueError):
            pass
        return [(row, by_name.get(row["Names"], {})) for row in rows], stats, None
    except (OSError, subprocess.CalledProcessError, subprocess.TimeoutExpired, json.JSONDecodeError) as exc:
        return [], {}, f"Docker не отвечает: {exc}"


def human_uptime(started_at: str, state: str) -> str:
    if state != "running" or not started_at or started_at.startswith("0001-"):
        return "—"
    try:
        started = datetime.fromisoformat(started_at.replace("Z", "+00:00"))
        seconds = max(0, int((datetime.now(timezone.utc) - started).total_seconds()))
        days, rem = divmod(seconds, 86400)
        hours, rem = divmod(rem, 3600)
        minutes = rem // 60
        return f"{days}д {hours}ч" if days else f"{hours}ч {minutes}м"
    except ValueError:
        return "—"


def check_site(url: str) -> tuple[str, bool]:
    request = urllib.request.Request(url, headers={"User-Agent": "Kiruhak-Uptime/1.0"}, method="GET")
    started = time.monotonic()
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            elapsed = round((time.monotonic() - started) * 1000)
            okay = 200 <= response.status < 400
            return f"{'🟢' if okay else '🔴'} <b>{html.escape(url)}</b> — HTTP {response.status}, {elapsed} мс", okay
    except urllib.error.HTTPError as exc:
        elapsed = round((time.monotonic() - started) * 1000)
        return f"🔴 <b>{html.escape(url)}</b> — HTTP {exc.code}, {elapsed} мс", False
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        elapsed = round((time.monotonic() - started) * 1000)
        reason = html.escape(str(getattr(exc, "reason", exc)))[:100]
        return f"🔴 <b>{html.escape(url)}</b> — нет ответа ({reason}), {elapsed} мс", False


def build_report() -> str:
    hostname = socket.gethostname()
    now = datetime.now(BARNAUL)
    rows, stats, docker_error = docker_snapshot()
    urls = [value.strip() for value in os.getenv("MONITOR_URLS", "https://kiruhak11.ru").split(",") if value.strip()]
    site_lines = [check_site(url) for url in urls[:12]]

    container_lines: list[str] = []
    running_count = sum(detail.get("State", {}).get("Status") == "running" for _, detail in rows)
    stopped_count = len(rows) - running_count
    failing = 0
    for row, detail in rows:
        state_data = detail.get("State", {})
        state = state_data.get("Status", "unknown")
        health = state_data.get("Health", {}).get("Status", "") if state == "running" else ""
        restart_count = detail.get("RestartCount", 0)
        okay = state == "running" and health in ("", "healthy")
        if state == "running" and not okay:
            failing += 1
        icon = "🟢" if okay else ("⚪" if state != "running" else "🔴")
        status = state + (f" / {health}" if health else "")
        uptime = human_uptime(state_data.get("StartedAt", ""), state)
        stat_text = ""
        if state == "running" and row["Names"] in stats:
            cpu, memory, mem_percent = stats[row["Names"]]
            stat_text = f" · CPU {cpu}, RAM {memory} ({mem_percent})"
        container_lines.append(
            f"{icon} <b>{html.escape(row['Names'])}</b> — {html.escape(status)}; "
            f"up {uptime}; рестартов {restart_count}{stat_text}"
        )

    sites_bad = sum(not okay for _, okay in site_lines)
    total_bad = failing + sites_bad + bool(docker_error)
    heading = "⚠️ Нужна проверка" if total_bad else "✅ Всё работает штатно"
    disk = shutil.disk_usage("/")
    disk_used = 100 * disk.used / disk.total if disk.total else 0

    sections = [
        f"<b>Ежедневный статус · {html.escape(hostname)}</b>",
        f"{now:%d.%m.%Y %H:%M} · {heading}",
        f"<b>Docker</b> · запущено: {running_count}, остановлено: {stopped_count}, проблем: {failing}",
    ]
    if docker_error:
        sections.append(f"🔴 {html.escape(docker_error[:250])}")
    sections.extend(container_lines or (["Контейнеры не найдены."] if not docker_error else []))
    sections.append(f"<b>Диск сервера</b> · занято {disk_used:.0f}% ({disk.used // (1024**3)} / {disk.total // (1024**3)} ГБ)")
    sections.append("<b>Сайты</b>")
    sections.extend(line for line, _ in site_lines)
    if len(urls) > 12:
        sections.append(f"…ещё сайтов в MONITOR_URLS: {len(urls) - 12}")
    report = "\n".join(sections)
    if len(report) > TELEGRAM_LIMIT - 100:
        report = report[: TELEGRAM_LIMIT - 130] + "\n…отчёт сокращён до лимита Telegram"
    return report


def send_report(message: str) -> None:
    token = os.environ["TELEGRAM_BOT_TOKEN"]
    chat_id = os.environ["TELEGRAM_CHAT_ID"]
    api_url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = urllib.parse.urlencode({
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "HTML",
        "disable_web_page_preview": "true",
    }).encode()
    proxy_url = os.getenv("TELEGRAM_HTTP_PROXY", "").strip()
    handlers = [urllib.request.ProxyHandler({"https": proxy_url, "http": proxy_url})] if proxy_url else []
    opener = urllib.request.build_opener(*handlers)
    request = urllib.request.Request(api_url, data=payload, method="POST")
    try:
        with opener.open(request, timeout=25) as response:
            result = json.loads(response.read())
            if response.status != 200 or not result.get("ok"):
                raise RuntimeError(f"Telegram API error: {result}")
    except urllib.error.HTTPError as exc:
        # HTTPError's string representation includes the bot token in the request URL.
        raise RuntimeError(f"Telegram API returned HTTP {exc.code}") from None


if __name__ == "__main__":
    send_report(build_report())
