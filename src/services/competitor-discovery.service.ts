import axios from "axios";
import { ISocialConnection } from "@/models";
import { logger } from "@/utils/logger";

export type CompetitorPlatform =
  | "linkedin"
  | "instagram"
  | "facebook"
  | "twitter";

export type TargetHandleMap = Partial<Record<CompetitorPlatform, string>>;

export type LiveDiscoverySource =
  | "live-linkedin"
  | "live-meta"
  | "live-twitter"
  | "live-merged";

export interface LiveDiscoveryCandidate {
  competitorId: string;
  name: string;
  platforms: CompetitorPlatform[];
  handles: TargetHandleMap;
  tags: string[];
  sourceConfidence: number;
  reason: string;
  source: LiveDiscoverySource;
}

interface LiveDiscoveryInput {
  genre: string;
  connectedPlatforms: CompetitorPlatform[];
  connections: Partial<
    Record<CompetitorPlatform, ISocialConnection | undefined>
  >;
  limit: number;
}

export interface LiveDiscoveryResult {
  candidates: LiveDiscoveryCandidate[];
  warnings: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function normalizeHandle(input: unknown): string {
  return (
    String(input || "")
      .trim()
      .toLowerCase()
      .replace(/^@+/, "")
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")
      .filter(Boolean)
      .pop() || ""
  );
}

function buildCompetitorId(nameOrHandle: string): string {
  const normalized = nameOrHandle
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || `competitor-${Date.now()}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function dedupeLiveCandidates(
  candidates: LiveDiscoveryCandidate[],
  limit: number,
): LiveDiscoveryCandidate[] {
  const byKey = new Map<string, LiveDiscoveryCandidate>();

  for (const candidate of candidates) {
    const handleKey =
      Object.values(candidate.handles)
        .find((value) => typeof value === "string" && value.length > 0)
        ?.toLowerCase() || "";

    const key = handleKey || candidate.competitorId;
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, candidate);
      continue;
    }

    existing.platforms = Array.from(
      new Set([...existing.platforms, ...candidate.platforms]),
    );
    existing.tags = Array.from(new Set([...existing.tags, ...candidate.tags]));
    existing.sourceConfidence = Math.max(
      existing.sourceConfidence,
      candidate.sourceConfidence,
    );
    existing.reason = Array.from(
      new Set([existing.reason, candidate.reason]),
    ).join(" | ");
    existing.source =
      existing.source === candidate.source ? existing.source : "live-merged";

    for (const platform of [
      "linkedin",
      "instagram",
      "facebook",
      "twitter",
    ] as const) {
      if (!existing.handles[platform] && candidate.handles[platform]) {
        existing.handles[platform] = candidate.handles[platform];
      }
    }
  }

  return Array.from(byKey.values())
    .sort((a, b) => {
      if (b.sourceConfidence !== a.sourceConfidence) {
        return b.sourceConfidence - a.sourceConfidence;
      }
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);
}

function toGenreQuery(genre: string): string {
  return genre
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");
}

function buildReason(prefix: string, genre: string): string {
  return `${prefix} for genre '${genre}'`;
}

function pickLinkedInName(entry: Record<string, unknown>): string | null {
  const direct =
    asString(entry.name) ||
    asString(entry.title) ||
    (isRecord(entry.title) ? asString(entry.title.text) : null);
  if (direct) return direct;

  const hitInfo = isRecord(entry.hitInfo) ? entry.hitInfo : null;
  if (!hitInfo) return null;

  const searchCompany = isRecord(
    hitInfo["com.linkedin.voyager.search.SearchCompany"],
  )
    ? (hitInfo["com.linkedin.voyager.search.SearchCompany"] as Record<
        string,
        unknown
      >)
    : null;

  if (!searchCompany) return null;

  return (
    asString(searchCompany.name) ||
    (isRecord(searchCompany.headlessCompany)
      ? asString(searchCompany.headlessCompany.name)
      : null)
  );
}

async function discoverLinkedIn(
  genre: string,
  connection: ISocialConnection,
  limit: number,
): Promise<LiveDiscoveryCandidate[]> {
  const accessToken = asString(connection.accessToken);
  if (!accessToken) return [];

  const query = toGenreQuery(genre);
  if (!query) return [];

  try {
    const response = await axios.get("https://api.linkedin.com/v2/search", {
      params: {
        q: "companies",
        keywords: query,
        start: 0,
        count: Math.min(20, limit * 3),
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
      timeout: 12000,
    });

    const payload = isRecord(response.data) ? response.data : {};
    const elements = Array.isArray(payload.elements) ? payload.elements : [];

    const candidates: LiveDiscoveryCandidate[] = [];
    for (const item of elements) {
      if (!isRecord(item)) continue;
      const name = pickLinkedInName(item);
      if (!name) continue;

      const vanity =
        asString(item.publicIdentifier) ||
        asString(item.vanityName) ||
        normalizeHandle(name);

      const handle = normalizeHandle(vanity);
      if (!handle) continue;

      candidates.push({
        competitorId: buildCompetitorId(handle || name),
        name,
        platforms: ["linkedin"],
        handles: { linkedin: handle },
        tags: ["linkedin", ...query.split(" ")],
        sourceConfidence: clamp(70 + query.split(" ").length * 3, 70, 90),
        reason: buildReason("LinkedIn company search match", genre),
        source: "live-linkedin",
      });
    }

    return dedupeLiveCandidates(candidates, limit);
  } catch (error) {
    const message =
      axios.isAxiosError(error) && error.response
        ? `LinkedIn API ${error.response.status}`
        : "LinkedIn API request failed";
    throw new Error(message);
  }
}

function handleFromFacebookLink(link: unknown): string {
  const value = asString(link);
  if (!value) return "";
  return normalizeHandle(value);
}

async function discoverMetaPages(
  genre: string,
  connection: ISocialConnection,
  limit: number,
): Promise<LiveDiscoveryCandidate[]> {
  const accessToken = asString(connection.accessToken);
  if (!accessToken) return [];

  const query = toGenreQuery(genre);
  if (!query) return [];

  try {
    const response = await axios.get(
      "https://graph.facebook.com/v19.0/search",
      {
        params: {
          type: "page",
          q: query,
          fields: "id,name,link,category,username,fan_count",
          limit: Math.min(25, limit * 4),
          access_token: accessToken,
        },
        timeout: 12000,
      },
    );

    const payload = isRecord(response.data) ? response.data : {};
    const rows = Array.isArray(payload.data) ? payload.data : [];

    const candidates: LiveDiscoveryCandidate[] = [];
    for (const row of rows) {
      if (!isRecord(row)) continue;
      const name = asString(row.name);
      if (!name) continue;

      const username = normalizeHandle(
        row.username || handleFromFacebookLink(row.link),
      );
      if (!username) continue;

      const fanCount = Number(row.fan_count || 0);

      candidates.push({
        competitorId: buildCompetitorId(username || name),
        name,
        platforms: ["facebook"],
        handles: { facebook: username },
        tags: ["facebook", ...query.split(" ")],
        sourceConfidence: clamp(62 + Math.log10(fanCount + 10) * 8, 62, 88),
        reason: buildReason("Meta page search match", genre),
        source: "live-meta",
      });
    }

    return dedupeLiveCandidates(candidates, limit);
  } catch (error) {
    const message =
      axios.isAxiosError(error) && error.response
        ? `Meta API ${error.response.status}`
        : "Meta API request failed";
    throw new Error(message);
  }
}

async function discoverTwitterFromRecentSearch(
  genre: string,
  connection: ISocialConnection,
  limit: number,
): Promise<LiveDiscoveryCandidate[]> {
  const accessToken = asString(connection.accessToken);
  if (!accessToken) return [];

  const query = toGenreQuery(genre);
  if (!query) return [];

  try {
    const response = await axios.get(
      "https://api.twitter.com/2/tweets/search/recent",
      {
        params: {
          query: `${query} -is:retweet lang:en`,
          max_results: Math.min(50, Math.max(15, limit * 5)),
          expansions: "author_id",
          "user.fields": "id,name,username,verified,public_metrics",
          "tweet.fields": "author_id",
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 12000,
      },
    );

    const payload = isRecord(response.data) ? response.data : {};
    const includes = isRecord(payload.includes) ? payload.includes : {};
    const users = Array.isArray(includes.users) ? includes.users : [];

    const candidates: LiveDiscoveryCandidate[] = [];
    for (const user of users) {
      if (!isRecord(user)) continue;
      const username = normalizeHandle(user.username);
      const name = asString(user.name);
      if (!username || !name) continue;

      const metrics = isRecord(user.public_metrics) ? user.public_metrics : {};
      const followers = Number(metrics.followers_count || 0);
      const verified = Boolean(user.verified);

      candidates.push({
        competitorId: buildCompetitorId(username),
        name,
        platforms: ["twitter"],
        handles: { twitter: username },
        tags: ["twitter", ...query.split(" ")],
        sourceConfidence: clamp(
          66 + Math.log10(followers + 10) * 8 + (verified ? 4 : 0),
          66,
          94,
        ),
        reason: buildReason("X recent-search author match", genre),
        source: "live-twitter",
      });
    }

    return dedupeLiveCandidates(candidates, limit);
  } catch (error) {
    const message =
      axios.isAxiosError(error) && error.response
        ? `X API ${error.response.status}`
        : "X API request failed";
    throw new Error(message);
  }
}

export async function discoverLiveCompetitorsByGenre(
  input: LiveDiscoveryInput,
): Promise<LiveDiscoveryResult> {
  const warnings: string[] = [];
  const candidates: LiveDiscoveryCandidate[] = [];

  for (const platform of input.connectedPlatforms) {
    const connection = input.connections[platform];
    if (!connection) {
      warnings.push(`No stored ${platform} connection found`);
      continue;
    }

    try {
      if (platform === "linkedin") {
        candidates.push(
          ...(await discoverLinkedIn(input.genre, connection, input.limit)),
        );
        continue;
      }

      if (platform === "facebook") {
        candidates.push(
          ...(await discoverMetaPages(input.genre, connection, input.limit)),
        );
        continue;
      }

      if (platform === "instagram") {
        const metaCandidates = await discoverMetaPages(
          input.genre,
          connection,
          input.limit,
        );

        for (const candidate of metaCandidates) {
          const instagramHandle = normalizeHandle(
            candidate.handles.facebook || candidate.name,
          );
          candidates.push({
            ...candidate,
            competitorId: buildCompetitorId(instagramHandle || candidate.name),
            platforms: ["instagram"],
            handles: {
              instagram: instagramHandle,
            },
            reason: buildReason("Meta-derived Instagram match", input.genre),
          });
        }
        continue;
      }

      if (platform === "twitter") {
        candidates.push(
          ...(await discoverTwitterFromRecentSearch(
            input.genre,
            connection,
            input.limit,
          )),
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      warnings.push(`${platform} discovery failed: ${message}`);
      logger.warn(
        `[CompetitorDiscovery] ${platform} discovery failed: ${message}`,
      );
    }
  }

  return {
    candidates: dedupeLiveCandidates(candidates, input.limit),
    warnings,
  };
}
