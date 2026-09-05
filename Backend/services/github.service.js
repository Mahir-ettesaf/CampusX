const GITHUB_API_URL = "https://api.github.com";
const REQUEST_TIMEOUT_MS = 10000;
const MAX_REPOSITORIES = 20;

export class GitHubApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const headers = () => {
  const value = {
    Accept: "application/vnd.github+json",
    "User-Agent": "CampusX",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) value.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return value;
};

const request = async (path) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${GITHUB_API_URL}${path}`, { headers: headers(), signal: controller.signal });
    if (!response.ok) {
      if (response.status === 404) throw new GitHubApiError(404, "GitHub user or repository was not found");
      if (response.status === 429 || response.headers.get("x-ratelimit-remaining") === "0") {
        throw new GitHubApiError(429, "GitHub is temporarily rate-limited. Please try again later.");
      }
      throw new GitHubApiError(502, "GitHub is currently unavailable. Please try again later.");
    }
    return response.json();
  } catch (error) {
    if (error instanceof GitHubApiError) throw error;
    if (error?.name === "AbortError") throw new GitHubApiError(504, "GitHub request timed out. Please try again.");
    throw new GitHubApiError(502, "GitHub is currently unavailable. Please try again later.");
  } finally {
    clearTimeout(timeout);
  }
};

const profileFields = (profile) => ({
  login: profile.login,
  name: profile.name,
  avatar_url: profile.avatar_url,
  html_url: profile.html_url,
  bio: profile.bio,
  company: profile.company,
  location: profile.location,
  blog: profile.blog,
  public_repos: profile.public_repos,
  followers: profile.followers,
  following: profile.following,
});

const repositoryFields = (repository) => ({
  id: repository.id,
  name: repository.name,
  description: repository.description,
  html_url: repository.html_url,
  language: repository.language,
  stargazers_count: repository.stargazers_count,
  forks_count: repository.forks_count,
  updated_at: repository.updated_at,
});

export const getPublicGitHubPortfolio = async (username) => {
  const encodedUsername = encodeURIComponent(username);
  const [profile, repositories] = await Promise.all([
    request(`/users/${encodedUsername}`),
    request(`/users/${encodedUsername}/repos?type=owner&sort=updated&per_page=${MAX_REPOSITORIES}`),
  ]);
  const languageRows = await Promise.all(repositories.map((repository) =>
    request(`/repos/${encodedUsername}/${encodeURIComponent(repository.name)}/languages`),
  ));
  const languageTotals = new Map();
  for (const languages of languageRows) {
    for (const [name, bytes] of Object.entries(languages)) {
      languageTotals.set(name, (languageTotals.get(name) || 0) + Number(bytes));
    }
  }

  return {
    profile: profileFields(profile),
    repositories: repositories.map(repositoryFields),
    languages: [...languageTotals.entries()]
      .map(([name, bytes]) => ({ name, bytes }))
      .sort((a, b) => b.bytes - a.bytes || a.name.localeCompare(b.name)),
    repositories_limited_to: MAX_REPOSITORIES,
  };
};
