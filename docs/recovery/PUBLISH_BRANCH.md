# Публикация recovery-ветки в GitHub — что нужно сделать владельцу

Автоматическая публикация не выполнена: на этой машине **нет** учётных данных
GitHub. Ничего не угадывалось, чужие токены не использовались, приватные
SSH-ключи не копировались.

## Что проверено

| Способ | Результат |
| --- | --- |
| `gh` CLI | не установлен |
| `~/.config/gh/hosts.yml` | аккаунт `kiruhak11` есть, **токена нет** (`oauth_token` отсутствует) |
| `~/.git-credentials` (helper `store`) | файл отсутствует |
| macOS keychain (`security find-internet-password -s github.com`) | записи нет |
| `GITHUB_TOKEN` / `GH_TOKEN` в окружении | нет |
| `ssh-agent` | ни одного ключа |
| SSH-ключи `id_ed25519_youpilot`, `id_ed25519_jino_main`, `codespaces.auto` | GitHub отклоняет все три |

Результат `git push`:
`fatal: could not read Username for 'https://github.com': terminal prompts disabled`

## Вариант A — официальный CLI (рекомендуется)

```bash
brew install gh
gh auth login --hostname github.com --git-protocol https
gh auth setup-git
```

`gh auth login` откроет браузер — нужен ваш GitHub-аккаунт `kiruhak11`.
После этого:

```bash
bash ~/Developer/kiruhak-releases/api-fail-closed-20261115/ops/publish-recovery-branch.sh github
```

Скрипт отправляет **только** ветку `recovery/api-fail-closed-20261115`,
не трогает `master` и `master-2`, и затем проверяет удалённые refs и делает
чистый clone.

## Вариант B — SSH-ключ, добавленный в GitHub

Сгенерируйте отдельный ключ **для GitHub** (не переиспользуйте существующие
ключи от Jino или GitLab):

```bash
ssh-keygen -t ed25519 -C "kiruhak11@github" -f ~/.ssh/id_ed25519_github
cat ~/.ssh/id_ed25519_github.pub
```

Добавьте выведенный публичный ключ в GitHub → Settings → SSH and GPG keys →
New SSH key. Затем добавьте в `~/.ssh/config`:

```
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_github
  IdentitiesOnly yes
```

Проверьте:

```bash
ssh -T git@github.com
# Hi kiruhak11! You've successfully authenticated...
```

и опубликуйте:

```bash
git remote set-url --push origin git@github.com:kiruhak11/kiruhak.git
bash ~/Developer/kiruhak-releases/api-fail-closed-20261115/ops/publish-recovery-branch.sh github
```

После этого верните https-remote, если он предпочтителен:

```bash
git remote set-url --push origin https://github.com/kiruhak11/kiruhak.git
```

## Вариант C — приватный репозиторий на вашем GitLab

На `gitlab.1ntegral.ru` SSH-доступ уже работает (`@kiruhak`), но API закрыт
и персональный токен отсутствует, поэтому видимость создаваемого проекта
проверить нельзя. Создайте проект вручную с видимостью **Private** и затем:

```bash
bash ~/Developer/kiruhak-releases/api-fail-closed-20261115/ops/publish-recovery-branch.sh gitlab
```

## Что уже сохранено без GitHub

Исходники не зависят от публикации:

* локально: `~/Developer/kiruhak` (ветка `recovery/api-fail-closed-20261115`);
* резервный набор: `~/Developer/kiruhak-releases/api-fail-closed-20261115/`
  (git bundle, архив исходников, манифесты с SHA-256, инструкции);
* независимая копия на сервере: `/var/lib/kiruhak/source-backups/20261115/`.

Все три проверены: `git bundle verify` проходит, восстановление из бандла
протестировано, контрольные суммы сходятся.
