#!/usr/bin/env bash
# Publish the recovered K-Studio source to a remote.
#
# The recovery branch is prepared locally in ~/Developer/kiruhak and is verified
# (secret scan, restore test, reproducibility run). Publishing it needs
# credentials that are NOT present on this machine, so this script is the
# handover step.
#
# It never touches master/main: it pushes exactly one new branch.
#
# Usage:
#   ./publish-recovery-branch.sh github     # -> the owner's public repo
#   ./publish-recovery-branch.sh gitlab     # -> a NEW PRIVATE project
#
set -euo pipefail

MODE="${1:-github}"
BRANCH="recovery/api-fail-closed-20261115"
REPO="${REPO:-$HOME/Developer/kiruhak}"
RELEASES="${RELEASES:-$HOME/Developer/kiruhak-releases/api-fail-closed-20261115}"

cd "$REPO"

echo "=== local state ==="
git log --oneline origin/master..HEAD
echo "branch to publish: ${BRANCH}"
echo "working tree: $(git status --porcelain | wc -l) uncommitted changes"

case "$MODE" in
  github)
    echo
    echo "=== GitHub: pushing ONE new branch to the owner's existing repo ==="
    echo "remote: $(git remote get-url origin)"
    echo "NOTE: master/main are NOT touched by this command."
    git push origin "${BRANCH}:refs/heads/${BRANCH}"

    echo
    echo "=== verifying remote refs ==="
    git ls-remote --heads origin | sed 's/^/  /'

    echo
    echo "=== verifying a fresh clone sees the branch ==="
    rm -rf /tmp/kstudio-verify-clone
    git clone -q --branch "${BRANCH}" \
      "https://github.com/kiruhak11/kiruhak.git" /tmp/kstudio-verify-clone
    cd /tmp/kstudio-verify-clone
    echo "  cloned HEAD: $(git log --oneline -1)"
    echo "  files       : $(git ls-files | wc -l)"
    git ls-files | head -5 | sed 's/^/    /'
    ;;

  gitlab)
    echo
    echo "=== GitLab: creating a NEW PRIVATE project and pushing the branch ==="
    TARGET="${GITLAB_TARGET:-git@gitlab.1ntegral.ru:kiruhak/kstudio-recovery.git}"
    echo "target: ${TARGET}"
    echo "The project is created by the first push (push-to-create)."
    echo "If your instance does not allow push-to-create, create the project"
    echo "manually first and mark it PRIVATE, then re-run this script."
    git push "$TARGET" "${BRANCH}:refs/heads/${BRANCH}"
    echo
    echo "=== verify ==="
    git ls-remote --heads "$TARGET" | sed 's/^/  /'
    echo "Confirm the project visibility is PRIVATE in the GitLab UI."
    ;;

  *)
    echo "usage: $0 [github|gitlab]" >&2
    exit 2
    ;;
esac

echo
echo "=== local backup set (independent of the remote) ==="
ls -la "$RELEASES"
(cd "$RELEASES" && sha256sum -c MANIFEST.sha256)

echo
echo "PUBLISH DONE"
