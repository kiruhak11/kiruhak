# Восстановление K-Studio из исходников

Документ описывает, как получить рабочую копию проекта и как поднять
окружение с нуля. Секретов в нём нет.

## 1. Получить исходники

Основной путь — восстановленная ветка:

```bash
git clone --branch recovery/api-fail-closed-20261115 \
  https://github.com/kiruhak11/kiruhak.git ~/Developer/kiruhak
cd ~/Developer/kiruhak
git log --oneline -11
```

Если внешний репозиторий недоступен, используйте локальный набор резервных
копий (вне iCloud):

```
~/Developer/kiruhak-releases/api-fail-closed-20261115/
```

| Артефакт | Что это |
| --- | --- |
| `kstudio-recovery-20261115.bundle` | git bundle со всей историей |
| `kstudio-source-20261115.tar.gz` | чистый архив исходников |
| `MANIFEST.sha256` | контрольные суммы набора |
| `FILES.txt`, `FILES-SHA256SUMS.txt` | манифест файлов |
| `RESTORE.md` | команды восстановления |
| `RELEASE_ARTIFACTS.md`, `PRODUCTION.md` | состояние релиза и production |

```bash
cd ~/Developer/kiruhak-releases/api-fail-closed-20261115
sha256sum -c MANIFEST.sha256
git bundle verify kstudio-recovery-20261115.bundle

mkdir -p ~/Developer/kiruhak
git clone kstudio-recovery-20261115.bundle ~/Developer/kiruhak/repo
cd ~/Developer/kiruhak/repo
git checkout recovery/api-fail-closed-20261115
```

Резервная копия дублируется на сервере:
`/var/lib/kiruhak/source-backups/20261115/` (root-only).

## 2. Поднять окружение

```bash
node -v            # требуется Node 22
npm ci             # строго по package-lock.json
npx prisma generate
```

Переменные окружения — см. `.env.example`. Реальные значения лежат только
на сервере в `/etc/kiruhak/secrets/*` и `/var/www/html/kiruhak/.env`.

## 3. База данных

Для актуальной ревизии используйте [инструкцию восстановления PostgreSQL](../runbooks/DATABASE_RECOVERY.md). Она описывает bootstrap пустой базы, восстановление дампа и проверку схемы. Для базы с данными выбирайте восстановление полного дампа с журналом миграций.

## 4. Проверки

```bash
npm run test:security              # 12 — fail-closed политика
npm run test:public                # 21 — публичное поведение
npm run test:admin                 # 10
npm run test:telegram              # 7
npm run test:telegram-login        # 12
npm run test:lead                  # 6
npm run typecheck                  # 211 ошибок — baseline ниже upstream (216)
npm run lint:portfolio
npm run lint:admin
npm run build                      # NODE_ENV=production
```

Интеграционный тест отзыва сессий требует изолированную PostgreSQL:

```bash
bash ops/run-session-revocation-integration.sh
```

Полная проверка воспроизводимости из резервной копии — на сервере:

```bash
bash ops/reproduce-from-backup.sh <bundle> /var/tmp/kiruhak-repro
```

## 5. Публикация ветки

```bash
bash ops/publish-recovery-branch.sh github
```

Скрипт отправляет **только** ветку `recovery/api-fail-closed-20261115` и
никогда не изменяет `master` / `master-2`.
