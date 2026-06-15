type JsonObject = Record<string, unknown>;

interface ApiError {
  message?: string;
  statusCode?: number;
}

interface ApiEnvelope<T = unknown> {
  success?: boolean;
  data?: T;
  error?: ApiError;
}

interface ApiResult<T = unknown> {
  status: number;
  ok: boolean;
  raw: string;
  body: ApiEnvelope<T> | null;
}

interface AuthData {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface BookmarkData {
  id: string;
  entityId: string;
  type: string;
}

const API_BASE = (
  process.env.API_BASE_URL || "http://localhost:3000/api/v1"
).replace(/\/$/, "");
const RUN_PIPELINE = /^(1|true|yes)$/i.test(
  process.env.API_TEST_PIPELINE || "",
);

const TEST_EMAIL =
  process.env.API_TEST_EMAIL || `api-smoke-${Date.now()}@example.com`;
const TEST_PASSWORD = process.env.API_TEST_PASSWORD || "Password123!";
const TEST_NAME = process.env.API_TEST_NAME || "API Smoke";

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function assertCondition(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function apiRequest<T = unknown>(
  endpoint: string,
  options: {
    method?: string;
    token?: string;
    body?: unknown;
  } = {},
): Promise<ApiResult<T>> {
  const method = options.method || "GET";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "1",
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const raw = await response.text();
  let body: ApiEnvelope<T> | null = null;

  if (raw.trim().length > 0) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (isObject(parsed)) {
        body = parsed as ApiEnvelope<T>;
      }
    } catch {
      body = null;
    }
  }

  return {
    status: response.status,
    ok: response.ok,
    raw,
    body,
  };
}

function formatFailure(step: string, result: ApiResult<unknown>): string {
  const message = result.body?.error?.message || "No JSON error message";
  const snippet = result.raw.slice(0, 300).replace(/\s+/g, " ").trim();
  return `${step} failed (HTTP ${result.status}): ${message}${snippet ? ` | body: ${snippet}` : ""}`;
}

function expectSuccess<T>(
  step: string,
  result: ApiResult<T>,
  expectedStatuses: number[] = [200],
): T {
  if (!expectedStatuses.includes(result.status)) {
    throw new Error(formatFailure(step, result));
  }

  if (!result.body?.success) {
    throw new Error(formatFailure(step, result));
  }

  return (result.body.data as T) || ({} as T);
}

function pickProjectId(data: unknown): string | null {
  if (!isObject(data)) return null;
  return asString(data.projectId) || asString(data.id);
}

function pickAssetId(data: unknown): string | null {
  if (!isObject(data)) return null;

  const direct = asString(data.selectedAssetId);
  if (direct) return direct;

  const assetItems = data.assetItems;
  if (Array.isArray(assetItems)) {
    for (const item of assetItems) {
      if (!isObject(item)) continue;
      const fromItems = asString(item.assetId) || asString(item.id);
      if (fromItems) return fromItems;
    }
  }

  const groupedAssets = data.assets;
  if (Array.isArray(groupedAssets)) {
    for (const group of groupedAssets) {
      if (!isObject(group)) continue;
      const versions = group.versions;
      if (!Array.isArray(versions)) continue;
      for (const version of versions) {
        if (!isObject(version)) continue;
        const fromVersion = asString(version.assetId) || asString(version.id);
        if (fromVersion) return fromVersion;
      }
    }
  }

  return null;
}



async function registerOrLogin(): Promise<AuthData> {
  const registerResult = await apiRequest<AuthData>("/auth/register", {
    method: "POST",
    body: {
      name: TEST_NAME,
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    },
  });

  if (registerResult.status === 201 && registerResult.body?.success) {
    return registerResult.body.data as AuthData;
  }

  const registerError = registerResult.body?.error?.message || "";
  if (
    registerResult.status === 409 ||
    /already registered|already exists/i.test(registerError)
  ) {
    const loginResult = await apiRequest<AuthData>("/auth/login", {
      method: "POST",
      body: {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      },
    });

    return expectSuccess<AuthData>("login existing user", loginResult, [200]);
  }

  throw new Error(formatFailure("register", registerResult));
}

async function runPipelineSmoke(token: string): Promise<void> {
  console.log("[api-smoke] Pipeline: create idea");
  const createIdea = await apiRequest<JsonObject>("/ai/content/idea", {
    method: "POST",
    token,
    body: {
      idea: "Create a concise campaign for a sustainable coffee brand.",
    },
  });
  const ideaData = expectSuccess<JsonObject>("create idea", createIdea, [201]);
  const projectId = pickProjectId(ideaData);

  if (!projectId) {
    throw new Error("create idea returned no project id");
  }

  console.log("[api-smoke] Pipeline: analyze idea");
  await expectSuccess<JsonObject>(
    "analyze idea",
    await apiRequest<JsonObject>("/ai/content/analyze", {
      method: "POST",
      token,
      body: { projectId },
    }),
    [200],
  );

  console.log("[api-smoke] Pipeline: generate image");
  const imageData = expectSuccess<JsonObject>(
    "generate image",
    await apiRequest<JsonObject>("/ai/content/generate-image", {
      method: "POST",
      token,
      body: { projectId, style: "modern", count: 1 },
    }),
    [200],
  );

  const assetId = pickAssetId(imageData);
  if (!assetId) {
    throw new Error("generate image returned no selectable asset id");
  }

  console.log("[api-smoke] Pipeline: select image");
  await expectSuccess<JsonObject>(
    "select image",
    await apiRequest<JsonObject>("/ai/content/select-image", {
      method: "POST",
      token,
      body: { projectId, assetId },
    }),
    [200],
  );

  console.log("[api-smoke] Pipeline: generate caption");
  expectSuccess<JsonObject>(
    "generate caption",
    await apiRequest<JsonObject>("/ai/content/generate-caption", {
      method: "POST",
      token,
      body: { projectId, tone: "professional", count: 2 },
    }),
    [200],
  );

  console.log("[api-smoke] Pipeline: save draft");
  const draftBody: Record<string, unknown> = {
    projectId,
    platforms: ["linkedin"],
  };

  await expectSuccess<JsonObject>(
    "save draft",
    await apiRequest<JsonObject>("/content/save-draft", {
      method: "POST",
      token,
      body: draftBody,
    }),
    [200],
  );

  console.log("[api-smoke] Pipeline: publish");
  await expectSuccess<JsonObject>(
    "publish project",
    await apiRequest<JsonObject>("/content/publish", {
      method: "POST",
      token,
      body: {
        projectId,
        platforms: ["linkedin"],
      },
    }),
    [200],
  );

  console.log("[api-smoke] Pipeline: fetch project");
  await expectSuccess<JsonObject>(
    "fetch project",
    await apiRequest<JsonObject>(`/ai/content/projects/${projectId}`, {
      method: "GET",
      token,
    }),
    [200],
  );
}

async function runCompetitorsSmoke(token: string): Promise<void> {
  const now = Date.now();
  const primaryCompetitorId = `api-comp-${now}`;
  const secondaryCompetitorId = `api-comp-${now + 1}`;
  const outOfScopeCompetitorId = `api-comp-${now + 2}`;

  console.log("[api-smoke] Competitors: upsert targets");
  const targetUpsertData = expectSuccess<JsonObject>(
    "competitors upsert targets",
    await apiRequest<JsonObject>("/competitors/targets", {
      method: "POST",
      token,
      body: {
        items: [
          {
            competitorId: primaryCompetitorId,
            name: "API Competitor One",
            platforms: ["linkedin", "twitter"],
            handles: {
              linkedin: `api-comp-one-${now}`,
              twitter: `api-comp-one-${now}`,
            },
            tags: ["api-smoke", "benchmark"],
            sourceConfidence: 90,
          },
          {
            competitorId: secondaryCompetitorId,
            name: "API Competitor Two",
            platforms: ["linkedin"],
            handles: {
              linkedin: `api-comp-two-${now}`,
            },
            tags: ["api-smoke"],
            sourceConfidence: 85,
          },
        ],
      },
    }),
    [200],
  );

  const targetCount = asNumber(targetUpsertData.count) ?? 0;
  assertCondition(targetCount >= 2, "competitors upsert targets returned no targets");

  console.log("[api-smoke] Competitors: list targets");
  const listedTargets = expectSuccess<unknown>(
    "competitors list targets",
    await apiRequest<unknown>("/competitors/targets", {
      method: "GET",
      token,
    }),
    [200],
  );

  assertCondition(
    Array.isArray(listedTargets),
    "competitors list targets did not return an array",
  );

  const hasPrimaryTarget = listedTargets.some(
    (target) => isObject(target) && target.competitorId === primaryCompetitorId,
  );
  assertCondition(hasPrimaryTarget, "primary competitor target was not returned");

  console.log("[api-smoke] Competitors: strict sync");
  const syncData = expectSuccess<JsonObject>(
    "competitors sync",
    await apiRequest<JsonObject>("/competitors/sync", {
      method: "POST",
      token,
      body: {
        items: [
          {
            competitorId: primaryCompetitorId,
            author: "API Competitor One",
            platform: "linkedin",
            externalPostId: `${primaryCompetitorId}-post-1`,
            postUrl: `https://www.linkedin.com/feed/update/${primaryCompetitorId}-post-1`,
            publishedAt: new Date().toISOString(),
            content: "Primary competitor post for smoke sync",
            engagement: 7.1,
            reach: 18000,
            shares: 140,
            confidence: 91,
            tags: ["api-smoke", "benchmark"],
          },
          {
            competitorId: secondaryCompetitorId,
            author: "API Competitor Two",
            platform: "linkedin",
            externalPostId: `${secondaryCompetitorId}-post-1`,
            postUrl: `https://www.linkedin.com/feed/update/${secondaryCompetitorId}-post-1`,
            publishedAt: new Date().toISOString(),
            content: "Secondary competitor post for smoke sync",
            engagement: 6.4,
            reach: 12000,
            shares: 80,
            confidence: 87,
            tags: ["api-smoke"],
          },
          {
            competitorId: outOfScopeCompetitorId,
            author: "Out of Scope Competitor",
            platform: "linkedin",
            externalPostId: `${outOfScopeCompetitorId}-post-1`,
            publishedAt: new Date().toISOString(),
            content: "This row should be skipped in strict sync",
            engagement: 5.5,
            reach: 9000,
            shares: 40,
            confidence: 70,
          },
        ],
      },
    }),
    [200],
  );

  const syncInserted = asNumber(syncData.inserted) ?? 0;
  const syncUpdated = asNumber(syncData.updated) ?? 0;
  const syncSkipped = asNumber(syncData.skipped) ?? 0;
  const syncInvalid = asNumber(syncData.invalid) ?? 0;

  assertCondition(
    syncInserted + syncUpdated >= 2,
    "competitors sync did not write expected target rows",
  );
  assertCondition(syncSkipped >= 1, "competitors sync did not skip out-of-scope row");
  assertCondition(syncInvalid === 0, "competitors sync returned invalid rows");

  console.log("[api-smoke] Competitors: leaderboard");
  const competitorsData = expectSuccess<JsonObject>(
    "competitors leaderboard",
    await apiRequest<JsonObject>("/competitors?range=30d", {
      method: "GET",
      token,
    }),
    [200],
  );

  const leaderboard = Array.isArray(competitorsData.leaderboard)
    ? competitorsData.leaderboard
    : [];
  assertCondition(leaderboard.length > 0, "competitors leaderboard is empty");

  const hasPrimaryInLeaderboard = leaderboard.some(
    (row) => isObject(row) && row.id === primaryCompetitorId,
  );
  assertCondition(
    hasPrimaryInLeaderboard,
    "primary competitor is missing from leaderboard",
  );

  console.log("[api-smoke] Competitors: feed");
  const feedData = expectSuccess<unknown>(
    "competitors feed",
    await apiRequest<unknown>(
      `/competitors/feed?competitorId=${encodeURIComponent(primaryCompetitorId)}`,
      {
        method: "GET",
        token,
      },
    ),
    [200],
  );

  assertCondition(Array.isArray(feedData), "competitors feed did not return an array");
  assertCondition(feedData.length > 0, "competitors feed returned no rows");

  console.log("[api-smoke] Competitors: analytics");
  const analyticsData = expectSuccess<JsonObject>(
    "competitors analytics",
    await apiRequest<JsonObject>(
      `/competitors/${encodeURIComponent(primaryCompetitorId)}/analytics`,
      {
        method: "GET",
        token,
      },
    ),
    [200],
  );

  assertCondition(isObject(analyticsData.summary), "competitors analytics missing summary");
  const postCount = asNumber(analyticsData.summary.postCount) ?? 0;
  assertCondition(postCount >= 1, "competitors analytics postCount is empty");
}

async function main(): Promise<void> {
  console.log(`[api-smoke] Base URL: ${API_BASE}`);

  console.log("[api-smoke] Step 1: health check");
  expectSuccess<JsonObject>(
    "health check",
    await apiRequest<JsonObject>("/health"),
    [200],
  );

  console.log("[api-smoke] Step 2: auth register/login");
  const auth = await registerOrLogin();
  const token = auth.token;

  if (!token) {
    throw new Error("auth flow did not return an access token");
  }

  console.log("[api-smoke] Step 3: profile");
  expectSuccess<JsonObject>(
    "profile",
    await apiRequest<JsonObject>("/auth/profile", {
      method: "GET",
      token,
    }),
    [200],
  );

  console.log("[api-smoke] Step 4: insights");
  expectSuccess<JsonObject>(
    "insights",
    await apiRequest<JsonObject>("/insights", {
      method: "GET",
      token,
    }),
    [200],
  );

  console.log("[api-smoke] Step 5: bookmarks create/list/delete");
  const bookmarkEntityId = `api-smoke-${Date.now()}`;
  const createdBookmark = expectSuccess<BookmarkData>(
    "create bookmark",
    await apiRequest<BookmarkData>("/bookmarks", {
      method: "POST",
      token,
      body: {
        entityId: bookmarkEntityId,
        type: "insight",
        title: "API smoke bookmark",
        meta: { source: "api-smoke" },
      },
    }),
    [201],
  );

  expectSuccess<JsonObject>(
    "list bookmarks",
    await apiRequest<JsonObject>("/bookmarks?type=insight", {
      method: "GET",
      token,
    }),
    [200],
  );

  expectSuccess<JsonObject>(
    "delete bookmark",
    await apiRequest<JsonObject>(`/bookmarks/${createdBookmark.id}`, {
      method: "DELETE",
      token,
    }),
    [200],
  );

  console.log("[api-smoke] Step 6: competitors targets/sync/feed/analytics");
  await runCompetitorsSmoke(token);

  if (RUN_PIPELINE) {
    console.log("[api-smoke] Step 7: optional AI pipeline flow enabled");
    await runPipelineSmoke(token);
  } else {
    console.log("[api-smoke] Step 7: optional AI pipeline flow skipped");
    console.log(
      "[api-smoke] Set API_TEST_PIPELINE=1 to run full pipeline endpoints.",
    );
  }

  console.log("[api-smoke] Completed successfully.");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[api-smoke] FAILED: ${message}`);
  process.exitCode = 1;
});
