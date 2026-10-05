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
  const url = normalizedUrl(value);
  return Boolean(url && !isRepositoryUrl(url));
}
