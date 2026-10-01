#!/usr/bin/env bash
set -euo pipefail

if [[ ${EUID} -ne 0 ]]; then
  echo "Run as root: sudo bash scripts/install_daily_report.sh" >&2
  exit 1
fi

repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
env_file=/etc/kiruhak-daily-report.env

if [[ ! -s "${env_file}" ]]; then
  echo "Missing ${env_file}. Create it with the values from deploy/systemd/kiruhak-daily-report.env.example, then chmod 600." >&2
  exit 1
fi

install -d -m 0755 /opt/kiruhak-daily-report
install -m 0755 "${repo_dir}/scripts/daily_server_report.py" /opt/kiruhak-daily-report/daily_server_report.py
install -m 0644 "${repo_dir}/deploy/systemd/kiruhak-daily-report.service" /etc/systemd/system/kiruhak-daily-report.service
install -m 0644 "${repo_dir}/deploy/systemd/kiruhak-daily-report.timer" /etc/systemd/system/kiruhak-daily-report.timer
chmod 0600 "${env_file}"

systemctl daemon-reload
systemctl enable --now kiruhak-daily-report.timer
systemctl start kiruhak-daily-report.service
systemctl --no-pager --full status kiruhak-daily-report.timer
