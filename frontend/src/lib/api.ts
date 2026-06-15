const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { message: string; statusCode: number };
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "1",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "Cannot reach the server. Make sure the backend is running on port 3000.",
    );
  }

  // Handle 401 globally — clear token and redirect
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    throw new Error("Session expired. Please sign in again.");
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      `Server returned an unexpected response (HTTP ${response.status}).`,
    );
  }

  const data: ApiResponse<T> = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data.error?.message || `Request failed (${response.status})`,
    );
  }

  return data.data as T;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GeneratedPost {
  _id: string;
  userId: string;
  platform: string;
  day: string;
  headline: string;
  points: string[];
  cta: string;
  generatedImageUrl?: string;
  editedImageUrl?: string;
  status: "draft" | "scheduled" | "published" | "failed";
  scheduledTime?: string;
  scheduledAt?: string;
  publishedAt?: string;
  errorMessage?: string;
  aiProvider?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentSuggestion {
  platform: "linkedin" | "instagram" | "facebook" | "twitter";
  headline: string;
  points: string[];
  cta: string;
  caption: string;
  hashtags: string[];
}

export interface SocialStatus {
  linkedin: { connected: boolean; profileName: string | null };
  facebook: { connected: boolean; pageName: string | null };
  instagram: { connected: boolean; pageName: string | null };
  twitter: { connected: boolean; profileName: string | null };
}

// ── API Client ────────────────────────────────────────────────────────────────

export const api = {
  auth: {
    register: (body: { name: string; email: string; password: string }) =>
      request<{
        user: { id: string; name: string; email: string };
        token: string;
      }>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
    login: (body: { email: string; password: string }) =>
      request<{
        user: { id: string; name: string; email: string };
        token: string;
      }>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
    profile: () =>
      request<{ id: string; name: string; email: string }>("/auth/profile"),
  },

  content: {
    generate: (body: { prompt: string; platform: string; day: string }) =>
      request<GeneratedPost | GeneratedPost[]>("/content/generate", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    generateFromIdea: (body: {
      prompt: string;
      platform: "linkedin" | "instagram" | "facebook" | "twitter";
      day: string;
    }) =>
      request<GeneratedPost>("/content/generate-idea", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    generateWeekly: (body: { prompt: string }) =>
      request<Record<string, GeneratedPost[]>>("/content/generate-weekly", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    generateSuggestions: (body: {
      prompt: string;
      platforms: Array<"linkedin" | "instagram" | "facebook" | "twitter">;
      tone?: string;
      objective?: string;
    }) =>
      request<{ suggestions: ContentSuggestion[] }>(
        "/content/generate-suggestions",
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      ),
  },

  image: {
    generate: (postId: string) =>
      request<GeneratedPost>("/image/generate", {
        method: "POST",
        body: JSON.stringify({ postId }),
      }),
    save: (postId: string, base64Image: string) =>
      request<GeneratedPost>("/image/save", {
        method: "POST",
        body: JSON.stringify({ postId, base64Image }),
      }),
    uploadCustom: (base64Image: string) =>
      request<{ imageUrl: string }>("/image/upload-custom", {
        method: "POST",
        body: JSON.stringify({ base64Image }),
      }),
  },

  posts: {
    /** Schedule an existing generated post */
    schedule: (postId: string, scheduledTime: string) =>
      request<GeneratedPost>("/schedule", {
        method: "POST",
        body: JSON.stringify({ postId, scheduledTime }),
      }),
    /** List all posts for authenticated user */
    list: () => request<GeneratedPost[]>("/posts"),
    /** Get a single post */
    get: (id: string) => request<GeneratedPost>(`/posts/${id}`),
    /** Delete a post */
    delete: (id: string) =>
      request<{ message: string }>(`/posts/${id}`, { method: "DELETE" }),
  },

  schedule: {
    /** Spec-compliant schedule endpoint: POST /api/schedule */
    create: (body: {
      content?: string;
      image?: string;
      platform: string;
      scheduledAt: string;
    }) =>
      request<{ jobId: string; status: string; scheduledAt: string }>(
        "/schedule",
        { method: "POST", body: JSON.stringify(body) },
      ),
    list: () => request<GeneratedPost[]>("/schedule"),
    delete: (id: string) =>
      request<{ message: string }>(`/schedule/${id}`, { method: "DELETE" }),
    batch: (body: {
      scheduledAt: string;
      image?: string;
      imageUrl?: string;
      items: Array<{
        platform: "linkedin" | "instagram" | "facebook" | "twitter";
        headline?: string;
        points?: string[];
        cta?: string;
        caption?: string;
        day?: string;
      }>;
    }) =>
      request<{
        scheduledAt: string;
        posts: Array<{
          _id: string;
          id: string;
          platform: string;
          headline: string;
          status: string;
          scheduledAt: string;
          imageUrl: string;
          createdAt: string;
        }>;
      }>("/schedule/batch", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },

  social: {
    status: () => request<SocialStatus>("/social-auth/status"),
    disconnect: (platform: string) => request(`/social-auth/disconnect/${platform}`, { method: "DELETE" }),
  },
  publish: {
    now: (body: { caption: string; imageUrl?: string; platforms: string[] }) =>
      request<{ results: Array<{ platform: string; status: string; error?: string }> }>(
        "/posts/publish-now",
        { method: "POST", body: JSON.stringify(body) },
      ),
  },
  analytics: {
    get: () => request<any>("/analytics"),
    overview: () => request<any>("/analytics/overview"),
    growthVsEngagement: () => request<any>("/analytics/growth-vs-engagement"),
    topNodes: () => request<any>("/analytics/top-nodes"),
    dataExplorer: (query?: string) => request<any>(`/analytics/data-explorer${query ? `?${query}` : ''}`),
    monthlyDeepdive: (month?: string) => request<any>(`/analytics/monthly-deepdive${month ? `?month=${month}` : ''}`),
    performanceNodes: (query?: string) => request<any>(`/analytics/performance-nodes${query ? `?${query}` : ''}`),
  },

  competitors: {
    get: () => request<any>("/competitors"),
    feed: (query?: string) => request<any>(`/competitors/feed${query ? `?${query}` : ''}`),
    insightSummary: () => request<any>("/competitors/insight-summary"),
    profile: (id: string) => request<any>(`/competitors/${id}/profile`),
    compareSelf: (id: string) => request<any>(`/competitors/${id}/compare-self`),
    posts: (id: string, query?: string) => request<any>(`/competitors/${id}/posts${query ? `?${query}` : ''}`),
    postImpact: (id: string, postId: string) => request<any>(`/competitors/${id}/posts/${postId}/impact`),
  },

  campaigns: {
    list: (query?: string) => request<any>(`/campaigns${query ? `?${query}` : ''}`),
    get: (id: string) => request<any>(`/campaigns/${id}`),
    create: (data: any) => request<any>("/campaigns", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/campaigns/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/campaigns/${id}`, { method: "DELETE" }),
    analytics: (id: string) => request<any>(`/campaigns/${id}/analytics`),
    timeline: (id: string) => request<any>(`/campaigns/${id}/timeline`),
    getObjective: (month: string) => request<any>(`/campaigns/objectives?month=${month}`),
    setObjective: (data: any) => request<any>("/campaigns/objectives", { method: "POST", body: JSON.stringify(data) }),
  },

  dashboard: {
    overview: () => request<any>("/dashboard/overview"),
    postImpact: (postId: string) => request<any>(`/dashboard/post-impact/${postId}`),
  },

  billing: {
    get: () => request<any>("/billing"),
    invoices: () => request<any>("/billing/invoices"),
  },

  activity: {
    get: (query?: string) => request<any>(`/activity${query ? `?${query}` : ''}`),
  },

  settings: {
    get: () => request<any>("/settings"),
  }
};
