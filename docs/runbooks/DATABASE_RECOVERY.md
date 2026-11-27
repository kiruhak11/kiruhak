# Восстановление базы данных K-Studio

Используйте PostgreSQL 15, исходники проверяемой ревизии, Node.js 22 и зависимости из lockfile. Подготовьте новый экземпляр PostgreSQL либо отдельную базу для репетиции. Подключите приложение к восстановленной базе только после проверок. App-only релиз не запускает миграции.

```bash
npm ci
npm run db:generate
```

## Пустая база

1. Создайте пустую базу с доступной для записи схемой `public`. Укажите её явно в `DATABASE_URL`. На время bootstrap эту базу использует только один процесс восстановления.
2. Примените историю миграций и проверьте её состояние.

```bash
DATABASE_URL="$EMPTY_DATABASE_URL" npm run db:bootstrap
DATABASE_URL="$EMPTY_DATABASE_URL" npx --no-install prisma migrate status
```

Bootstrap сверяет SHA-256 миграции `20261008120000_reclassify_client_projects`, проверяет, что `public` пуста, и регистрирует эту миграцию через `prisma migrate resolve --applied`. Она только переклассифицирует четыре известных проекта, которых на пустой базе нет. Остальные миграции выполняет `prisma migrate deploy`. В журнале будет 14 завершённых записей, у переклассификации будет `applied_steps_count = 0`. Таблица проектов останется пустой. [Документация Prisma о baselining](https://www.prisma.io/docs/orm/prisma-migrate/workflows/baselining)

Обычный `prisma migrate deploy` с пустой базы остановится на исторической переклассификации. Если bootstrap прервался, проверьте причину и начните с новой пустой базы. Bootstrap отказывается работать с непустой схемой.

## Восстановление из резервной копии

Восстанавливайте полный дамп, включая `_prisma_migrations`, в новую изолированную базу. Ниже приведены команды для custom-дампа. `RESTORE_PG_URL` — PostgreSQL URI для клиентских утилит без параметров Prisma, таких как `?schema=public`. Используйте ту же базу в `RESTORE_DATABASE_URL`.

```bash
pg_restore --list "$BACKUP_FILE"
pg_restore --exit-on-error --single-transaction --no-owner --no-privileges \
  --dbname="$RESTORE_PG_URL" "$BACKUP_FILE"
```

Для текстового дампа используйте `psql -X --set=ON_ERROR_STOP=1 --dbname="$RESTORE_PG_URL" --file="$BACKUP_FILE"`. Если дамп явно создаёт `public`, подготовьте целевую изолированную базу без этой схемы. Перед восстановлением проверьте контрольную сумму дампа по манифесту резервной копии.

Проверьте имена и контрольные суммы завершённых миграций перед применением ожидающих миграций.

```bash
psql -X "$RESTORE_PG_URL" -v ON_ERROR_STOP=1 -At -c \
  'SELECT migration_name, checksum FROM public._prisma_migrations
   WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY migration_name'
for file in prisma/migrations/*/migration.sql; do
  sha256sum "$file"
done
```

В macOS вместо `sha256sum` используйте `shasum -a 256`. Все уже применённые миграции должны иметь соответствующий файл с той же суммой. При неизвестной миграции, несовпадении суммы, незавершённой попытке или отсутствии журнала остановите восстановление и проверьте происхождение дампа. Для согласованной базы примените ожидающие миграции.

```bash
DATABASE_URL="$RESTORE_DATABASE_URL" npm run db:migrate
DATABASE_URL="$RESTORE_DATABASE_URL" npx --no-install prisma migrate status
psql -X "$RESTORE_PG_URL" -v ON_ERROR_STOP=1 -f ops/check-db-tables.sql
```

Дамп от 11 октября 2026 года содержит 12 из 14 миграций. На его копии `db:migrate` применил `20261011150000_create_auth_revoked_sessions` и `20261021120000_add_indexes_and_constraints`. Число строк в существовавших таблицах сохранилось. Последняя миграция может исправлять значения вне допустимого диапазона и отвязывать осиротевшие `visits.userId`. Проверьте ожидаемые данные после обновления.

## Проверка schema drift

Prisma проверяет те объекты, которые умеет описывать её модель. PostgreSQL `CHECK` хранится в SQL-миграциях и проверяется отдельно нативным дампом. Используйте один и тот же `pg_dump` для двух проверяемых БД. `REFERENCE_PG_URL` указывает на чистую БД, которую создал `db:bootstrap`.

```bash
npx --no-install prisma migrate diff \
  --from-url "$RESTORE_DATABASE_URL" \
  --to-schema-datamodel prisma/schema.prisma --exit-code

dump_schema() {
  pg_dump --schema-only --schema=public --no-owner --no-privileges \
    --no-comments --restrict-key=KStudioSchemaComparison --dbname="$1"
}
dump_schema "$REFERENCE_PG_URL" > reference-schema.sql
dump_schema "$RESTORE_PG_URL" > restored-schema.sql
diff -u reference-schema.sql restored-schema.sql
```

Команда использует `pg_dump` с поддержкой `--restrict-key`. Со старым клиентом уберите этот параметр. Для обеих проверок ожидается пустая разница. ACL, владельцы и комментарии исключены из сравнения. Команды `db push` и `migrate reset` не входят в процедуру восстановления. Для проверки схемы через теневую БД используйте фактическую БД с пройденным bootstrap как источник сравнения. Прямое воспроизведение каталога через `migrate diff --from-migrations` снова запускает историческую миграцию данных на пустой теневой БД.

## Источник восстановленной миграции

`20261021120000_add_indexes_and_constraints` была применена 22 октября 2026 года. Её исходный SQL сохранился в каталогах `/var/www/html/kiruhak/releases/audit-20261022/` и `audit-20261022-rc1/` на VPS. В `master` этот SQL не попал. Файлы в двух каталогах совпадают побайтно. SHA-256 совпадает с `public._prisma_migrations.checksum`.

```text
37f871598136690be2c639c734445622fdb8f725314c558e72c048f294fcdca6
```

Все 14 файлов сверены с журналом production. Prisma-модель приведена к существующей схеме. Её индексы, связи, таблицы и типы соответствуют SQL, а нативные ограничения по-прежнему создаются исходными миграциями.
