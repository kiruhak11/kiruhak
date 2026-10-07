export interface ProjectExternalLinks {
  liveUrl?: string | null;
  githubUrl?: string | null;
}

const unavailableRepositories = new Set([
  "https://github.com/kiruhak11/lexid",
  "https://github.com/kiruhak11/mixers",
  "https://github.com/kiruhak11/overheat",
  "https://github.com/kiruhak11/remdom",
]);

function normalizedUrl(value?: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.hostname.toLowerCase() === "github.ru") {
      url.hostname = "github.com";
    }
    return url.toString();
  } catch {
    return null;
  }
}

function isRepositoryUrl(value: string | null): boolean {
  if (!value) return false;
  const host = new URL(value).hostname.toLowerCase();
  return host === "github.com" || host === "gitlab.com" || host === "bitbucket.org";
}

function isAvailableRepositoryUrl(value: string | null): boolean {
  return isRepositoryUrl(value) && !unavailableRepositories.has(value!.replace(/\/$/, "").toLowerCase());
}

function hasControlCharacters(value: string): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code <= 0x1f || code === 0x7f;
  });
}

export function getProjectExternalLinks(project: ProjectExternalLinks) {
  const rawLiveUrl = normalizedUrl(project.liveUrl);
  const rawGithubUrl = normalizedUrl(project.githubUrl);
  const repositoryUrl = isAvailableRepositoryUrl(rawGithubUrl)
    ? rawGithubUrl
    : isAvailableRepositoryUrl(rawLiveUrl)
      ? rawLiveUrl
      : null;
  const liveUrl =
    rawLiveUrl &&
    !isRepositoryUrl(rawLiveUrl) &&
    rawLiveUrl !== rawGithubUrl
      ? rawLiveUrl
      : null;

  return {
    liveUrl,
    githubUrl: isAvailableRepositoryUrl(rawGithubUrl)
      ? rawGithubUrl
      : repositoryUrl,
  };
}

export function isUsableProjectPreview(value?: string | null): boolean {
  if (!value || value !== value.trim() || hasControlCharacters(value)) return false;

  // Local portfolio assets are intentionally root-relative. Keep this rule
  // confined to previews; external project links still require absolute URLs.
  if (value.startsWith("/")) {
    if (value.startsWith("//") || value.includes("\\")) return false;

    const pathname = value.split(/[?#]/, 1)[0] ?? "";
    try {
      if (
        pathname.split("/").some((segment) => {
          const decoded = decodeURIComponent(segment);
          return (
            decoded === "." ||
            decoded === ".." ||
            decoded.includes("\\") ||
            decoded.includes("/") ||
            hasControlCharacters(decoded)
          );
        })
      ) {
        return false;
      }
    } catch {
      return false;
    }

    return true;
  }

  const url = normalizedUrl(value);
  return Boolean(url && !isRepositoryUrl(url));
}
