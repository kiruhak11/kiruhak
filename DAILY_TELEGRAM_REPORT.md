# Ежедневный статус сервера в Telegram

`scripts/daily_server_report.py` формирует одно HTML-сообщение со всеми Docker-контейнерами (состояние, Docker healthcheck, время работы, количество рестартов, CPU/RAM), занятостью диска и HTTP-проверками URL из `MONITOR_URLS`. Если любой контейнер/сайт неисправен или Docker недоступен, заголовок отчёта это отмечает. Telegram-запрос идёт через `TELEGRAM_HTTP_PROXY`; URL сайтов проверяются напрямую.

На VPS с установленными Docker и systemd:

1. Создать `/etc/kiruhak-daily-report.env` с `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_HTTP_PROXY` и списком `MONITOR_URLS` через запятую. Шаблон без секретов находится в `deploy/systemd/kiruhak-daily-report.env.example`.
2. Ограничить доступ к файлу: `chmod 600 /etc/kiruhak-daily-report.env`.
3. Из корня репозитория запустить `sudo bash scripts/install_daily_report.sh`.

Таймер запускает отчёт ежедневно в 12:00 `Asia/Barnaul` и отправляет тестовое сообщение во время установки. Результат и ошибки последнего запуска доступны командами `systemctl status kiruhak-daily-report.service` и `journalctl -u kiruhak-daily-report.service -n 50`. Изменение времени выполнения — в `deploy/systemd/kiruhak-daily-report.timer`.

Токен Telegram и proxy URL нельзя сохранять в Git. Если токен когда-либо публиковался, перед эксплуатацией отозвать его через BotFather и заменить в env-файле.
