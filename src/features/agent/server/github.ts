// src/features/agent/server/github.ts
// Fetches source code from a public GitHub repo/folder/file URL via the
// GitHub contents API, with strict limits so the result fits an LLM prompt.

const CODE_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  ".py",
  ".rb",
  ".go",
  ".rs",
  ".java",
  ".kt",
  ".php",
  ".sh",
]);
const SPECIAL_FILES = new Set(["package.json", "readme.md"]);
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".github",
  "dist",
  "build",
  ".next",
  "out",
  "vendor",
  "__pycache__",
  "coverage",
  "test",
  "tests",
  "__tests__",
  "docs",
]);

const MAX_FILES = 12;
const MAX_FILE_BYTES = 100_000;
const MAX_CHARS_PER_FILE = 12_000;
const MAX_TOTAL_CHARS = 45_000;
const MAX_DEPTH = 3;

export type ParsedGithubUrl = {
  owner: string;
  repo: string;
  ref?: string;
  path: string;
};

export type GithubFile = { path: string; content: string };

export function parseGithubUrl(rawUrl: string): ParsedGithubUrl {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    throw new Error("Invalid URL");
  }
  if (url.hostname !== "github.com" && url.hostname !== "www.github.com") {
    throw new Error("Only github.com URLs are supported");
  }

  const parts = url.pathname.split("/").filter(Boolean);
  const [owner, repo, kind, ref, ...rest] = parts;
  if (!owner || !repo) {
    throw new Error(
      "URL must point to a repository, e.g. https://github.com/owner/repo",
    );
  }

  if (kind === "tree" || kind === "blob") {
    return { owner, repo, ref, path: rest.join("/") };
  }
  return { owner, repo, path: "" };
}

const githubHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "nodebase-agent",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
};

type ContentsEntry = {
  type: "file" | "dir" | "symlink" | "submodule";
  name: string;
  path: string;
  size: number;
  content?: string;
  download_url?: string | null;
};

async function fetchContents(
  parsed: ParsedGithubUrl,
  path: string,
): Promise<ContentsEntry | ContentsEntry[]> {
  const refQuery = parsed.ref ? `?ref=${encodeURIComponent(parsed.ref)}` : "";
  const url = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/contents/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}${refQuery}`;

  const response = await fetch(url, { headers: githubHeaders() });
  if (response.status === 404) {
    throw new Error(
      `Not found on GitHub: ${parsed.owner}/${parsed.repo}${path ? `/${path}` : ""} — is the repo public?`,
    );
  }
  if (response.status === 403) {
    throw new Error(
      "GitHub API rate limit reached. Add a GITHUB_TOKEN to .env or try again later.",
    );
  }
  if (!response.ok) {
    throw new Error(`GitHub API error ${response.status}`);
  }
  return response.json();
}

const isCodeFile = (name: string): boolean => {
  const lower = name.toLowerCase();
  if (SPECIAL_FILES.has(lower)) return true;
  const dot = lower.lastIndexOf(".");
  return dot !== -1 && CODE_EXTENSIONS.has(lower.slice(dot));
};

export async function fetchGithubCode(
  parsed: ParsedGithubUrl,
): Promise<GithubFile[]> {
  const files: GithubFile[] = [];
  let totalChars = 0;

  const addFile = (path: string, content: string) => {
    const trimmed =
      content.length > MAX_CHARS_PER_FILE
        ? `${content.slice(0, MAX_CHARS_PER_FILE)}\n// ... truncated ...`
        : content;
    files.push({ path, content: trimmed });
    totalChars += trimmed.length;
  };

  const limitsReached = () =>
    files.length >= MAX_FILES || totalChars >= MAX_TOTAL_CHARS;

  const visit = async (path: string, depth: number): Promise<void> => {
    if (limitsReached()) return;

    const entry = await fetchContents(parsed, path);

    if (Array.isArray(entry)) {
      // Files first so shallow code wins over deeply nested code
      for (const item of entry) {
        if (limitsReached()) return;
        if (item.type !== "file" || !isCodeFile(item.name)) continue;
        if (item.size > MAX_FILE_BYTES || !item.download_url) continue;
        const response = await fetch(item.download_url, {
          headers: githubHeaders(),
        });
        if (!response.ok) continue;
        addFile(item.path, await response.text());
      }
      if (depth >= MAX_DEPTH) return;
      for (const item of entry) {
        if (limitsReached()) return;
        if (item.type !== "dir" || SKIP_DIRS.has(item.name.toLowerCase()))
          continue;
        await visit(item.path, depth + 1);
      }
      return;
    }

    if (entry.type === "file" && entry.content) {
      addFile(
        entry.path,
        Buffer.from(entry.content, "base64").toString("utf8"),
      );
    }
  };

  await visit(parsed.path, 0);
  return files;
}

export function formatFilesForPrompt(files: GithubFile[]): string {
  let output = "";
  for (const file of files) {
    const section = `\n===== FILE: ${file.path} =====\n${file.content}\n`;
    if (output.length + section.length > MAX_TOTAL_CHARS) {
      output += "\n===== (remaining files omitted for length) =====\n";
      break;
    }
    output += section;
  }
  return output;
}
