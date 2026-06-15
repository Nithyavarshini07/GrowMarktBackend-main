# GrowMarket Backend API Documentation (MongoDB Edition)

This document describes the rebuilt backend contract for GrowMarket.

- Stack: Node.js, Express, TypeScript, MongoDB (Mongoose)
- API Base URL: `http://localhost:3000/api/v1`
- Realtime WebSocket URL: `ws://localhost:3000/ws`

---

## 1. Folder Structure

```text
src/
  app.ts
  index.ts
  config/
    index.ts
  controllers/
    ai-content.controller.ts
    activity.controller.ts
    analytics.controller.ts
    auth.controller.ts
    bookmarks.controller.ts
    billing.controller.ts
    campaign.controller.ts
    competitors.controller.ts
    content.controller.ts
    dashboard.controller.ts
    image.controller.ts
    insights.controller.ts
    nodes.controller.ts
    notification.controller.ts
    scheduler.controller.ts
    settings.controller.ts
    social-auth.controller.ts
  jobs/
    scheduler.job.ts
  middleware/
    auth.middleware.ts
    error.middleware.ts
    validate.middleware.ts
  models/
    activity.model.ts
    billing.model.ts
    bookmark.model.ts
    campaign.model.ts
    competitor-feed.model.ts
    competitor-target.model.ts
    content-project.model.ts
    generated-post.model.ts
    notification.model.ts
    settings.model.ts
    user.model.ts
    index.ts
  realtime/
    events.ts
    websocket.server.ts
    index.ts
  routes/
    activity.routes.ts
    ai-content.routes.ts
    analytics.routes.ts
    auth.routes.ts
    bookmarks.routes.ts
    billing.routes.ts
    campaign.routes.ts
    competitors.routes.ts
    content.routes.ts
    dashboard.routes.ts
    image.routes.ts
    insights.routes.ts
    nodes.routes.ts
    notification.routes.ts
    scheduler.routes.ts
    settings.routes.ts
    social-auth.routes.ts
    index.ts
  services/
    ai-content-pipeline.service.ts
    activity-notification.service.ts
    auth-token.service.ts
    post-format.service.ts
    simple-cache.service.ts
    simple-queue.service.ts
    workspace-bootstrap.service.ts
    ...existing services
  utils/
    database.ts
    errors.ts
    ids.ts
    logger.ts
    pagination.ts
    response.ts
    validation.ts
```

---

## 2. MongoDB Schema Summary (No Prisma)

### User

- `_id`, `name`, `email`, `password`, `role`
- `socialConnections` (linkedin/facebook/instagram/twitter)
- `oauthProviders` (google/linkedin)
- `refreshTokens[]` for session persistence
- `resetPasswordTokenHash`, `resetPasswordExpiresAt`
- `createdAt`, `updatedAt`

### GeneratedPost

- `_id`, `userId`, `campaignId`, `contentProjectId`
- `platform`, `content`, `day`, `headline`, `points`, `cta`
- `mediaUrls[]`, `generatedImageUrl`, `editedImageUrl`
- `status`: `draft|scheduled|published|failed`
- `workflowStatus`: `DRAFT|READY|LIVE`
- `scheduledAt`, `scheduledTime`, `publishedAt`
- metrics: `reach`, `engagementRate`, `likes`, `comments`, `shares`, `saves`, `sentiment`
- `isTopPerformer`, `createdAt`, `updatedAt`

### Campaign

- `_id`, `userId`, `name`, `objective`
- `status`: `LIVE|DRAFT|READY|PAUSED|COMPLETED`
- `channels[]`, `collaborators[]`
- goal tracking fields (`targetReach`, `currentReach`, etc.)
- `startDate`, `endDate`, `createdAt`, `updatedAt`

### ContentProject (Pipeline Root)

- `_id`, `userId`, `campaignId`
- `status`: `IDEA|ANALYZED|IMAGE_GENERATED|EDITED|CAPTION_GENERATED|READY|PUBLISHED`
- `ideaInput`
- `analysis` (`targetAudience`, `contentAngles[]`, `hooks[]`, `hashtags[]`, `engagementPrediction`)
- `assets[]` with versioned history (`assetId`, `kind`, `url`, `sourceAssetId`, `version`, `meta`)
- `selectedAssetId`
- `captions[]` (`id`, `text`, `isSelected`, `hashtags[]`, `tone`, `source`, `createdAt`)
- `platforms[]`, `scheduledAt`, `postIds[]`
- `error` (`step`: `IMAGE_GENERATION|CAPTION|ANALYSIS`, `message`, `retryable`, `failedAt`)
- `history[]` (status transitions + actions)
- `createdAt`, `updatedAt`

### Bookmark

- `_id`, `userId`, `entityId`, `type`
- `type`: `post|competitor|insight|project`
- `title`, `meta`, `createdAt`, `updatedAt`

### CompetitorFeedItem

- `_id`, `userId`, `competitorId`, `author`, `platform`
- `source`: `manual|sync|api`
- `externalPostId`, `postUrl`, `publishedAt`, `confidence`
- `content`, `engagement`, `reach`, `shares`, `tags[]`
- dedupe index: `(userId, competitorId, platform, externalPostId)` (partial unique)
- query indexes for platform/date/ranking paths
- `createdAt`, `updatedAt`

### CompetitorTarget

- `_id`, `userId`, `competitorId`, `name`
- `platforms[]`, `handles` (`linkedin|instagram|facebook|twitter`)
- `tags[]`, `active`, `sourceConfidence`
- sync tracking: `lastSyncedAt`, `syncStatus`, `syncMessage`
- unique index: `(userId, competitorId)`
- `createdAt`, `updatedAt`

### Activity

- `_id`, `userId`, `category`, `type`, `title`, `description`, `actor`, `meta`
- `timestamp`, `createdAt`, `updatedAt`

### Notification

- `_id`, `userId`, `type`, `category`, `title`, `description`, `actor`, `meta`
- `channels[]`, `isRead`, `timestamp`, `createdAt`, `updatedAt`

### Settings

- `_id`, `userId`
- `profile`, `team[]`, `connectedChannels[]`, `notifications`, `support`
- `createdAt`, `updatedAt`

### Billing

- `_id`, `userId`, `plan`, `price`, `currency`, `billingCycle`
- `usage`, `nextInvoiceDate`, `status`, `createdAt`, `updatedAt`

---

## 3. Global API Rules

### Authentication

Protected endpoints require:

```http
Authorization: Bearer <jwt>
```

### Standard envelope

Most JSON responses:

```json
{
  "success": true,
  "data": {}
}
```

### Standard error envelope

All error responses use:

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "statusCode": 400
  }
}
```

### Paginated list envelope

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  },
  "filters": {},
  "sort": { "sortBy": "createdAt", "sortOrder": "desc" }
}
```

Common query params:

- `page`, `limit`
- `sortBy`, `sortOrder`
- `q` (search)
- `platform`, `status`, `type`, `category`
- `range` (`7d|14d|30d|90d`)
- `from`, `to`

## 3.1. Health API

## GET /health

Response data schema:

```json
{
  "status": "healthy",
  "timestamp": "2026-...",
  "uptime": 12345.67,
  "version": "v1"
}
```

---

## 4. Auth APIs

## POST /auth/register

Request body:

```json
{ "name": "", "email": "", "password": "" }
```

Response data schema:

```json
{
  "user": {
    "id": "",
    "name": "",
    "email": "",
    "role": "owner",
    "createdAt": "",
    "updatedAt": ""
  },
  "token": "jwt",
  "refreshToken": "string"
}
```

## POST /auth/login

Request body:

```json
{ "email": "", "password": "" }
```

Response data schema:

```json
{
  "user": {
    "id": "",
    "name": "",
    "email": "",
    "role": "owner",
    "createdAt": "",
    "updatedAt": ""
  },
  "token": "jwt",
  "refreshToken": "string"
}
```

## POST /auth/oauth

Request body:

```json
{ "provider": "google", "providerId": "", "email": "", "name": "" }
```

Response data schema:

```json
{
  "user": {
    "id": "",
    "name": "",
    "email": "",
    "role": "owner",
    "createdAt": "",
    "updatedAt": ""
  },
  "token": "jwt",
  "refreshToken": "string"
}
```

## POST /auth/forgot-password

Request body:

```json
{ "email": "" }
```

Response data schema:

```json
{
  "message": "If this email exists, a reset link has been generated.",
  "expiresAt": "2026-...",
  "resetToken": "dev-only-token"
}
```

## POST /auth/reset-password

Request body:

```json
{ "token": "", "newPassword": "" }
```

Response data schema:

```json
{
  "user": {
    "id": "",
    "name": "",
    "email": "",
    "role": "owner",
    "createdAt": "",
    "updatedAt": ""
  },
  "token": "jwt",
  "refreshToken": "string"
}
```

## POST /auth/refresh-token

Request body:

```json
{ "refreshToken": "" }
```

Response data schema:

```json
{
  "user": {
    "id": "",
    "name": "",
    "email": "",
    "role": "owner",
    "createdAt": "",
    "updatedAt": ""
  },
  "token": "jwt",
  "refreshToken": "string"
}
```

## POST /auth/logout

Request body:

```json
{ "refreshToken": "" }
```

Response data schema:

```json
{ "message": "Logged out" }
```

## GET /auth/profile

Response data schema:

```json
{
  "id": "",
  "name": "",
  "email": "",
  "role": "owner",
  "createdAt": "",
  "updatedAt": ""
}
```

---

## 5. Dashboard API

## GET /dashboard/overview

Query filters:

- none

Response data schema:

```json
{
  "metrics": {
    "totalReach": 0,
    "engagementRate": 0,
    "followersGrowth": 0
  },
  "audienceExpansion": {
    "toggle": "daily",
    "points": [{ "label": "1", "value": 0 }]
  },
  "platforms": [{ "platform": "instagram", "value": 0, "growth": 0 }],
  "activityPreview": [
    {
      "id": "",
      "type": "success",
      "title": "",
      "description": "",
      "timestamp": "",
      "actor": "",
      "meta": {}
    }
  ],
  "scheduledPosts": [],
  "timestamps": { "generatedAt": "" }
}
```

---

## 6. Analytics APIs

## GET /analytics

Response data schema:

```json
{
  "stats": {
    "totalPosts": 0,
    "draftPosts": 0,
    "scheduledPosts": 0,
    "publishedPosts": 0,
    "failedPosts": 0,
    "successRate": 0
  },
  "timeSeries": [
    { "label": "2026-04-20", "posts": 0, "published": 0, "scheduled": 0 }
  ],
  "platformBreakdown": [
    {
      "platform": "linkedin",
      "label": "Linkedin",
      "value": 0,
      "color": "#0a66c2"
    }
  ],
  "statusBreakdown": [
    { "status": "draft", "label": "Draft", "value": 0, "color": "#777f8d" }
  ],
  "dayActivity": [{ "day": "Mon", "value": 0 }]
}
```

## GET /analytics/insights

Response data schema:

```json
{
  "insights": [
    {
      "id": "",
      "type": "trend",
      "title": "",
      "description": ""
    }
  ],
  "metrics": {
    "currentAverageEngagementRate": 0,
    "previousAverageEngagementRate": 0,
    "weekOverWeekDelta": 0
  }
}
```

## GET /analytics/time-series

Query filters:

- `range`: `7d|14d|30d|90d`

Response data schema:

```json
{
  "range": "30d",
  "points": [{ "date": "2026-04-20", "reach": 1000, "engagement": 4.2 }]
}
```

## GET /analytics/top-nodes

Query filters:

- `page`, `limit`
- `platform`
- `sortBy` (`engagementRate|reach|createdAt|publishedAt`)
- `sortOrder`

Response data schema:

```json
[
  {
    "id": "",
    "title": "",
    "platform": "instagram",
    "publishedAt": "",
    "engagementRate": 4.82,
    "reach": 12500,
    "isTopPerformer": true,
    "createdAt": "",
    "updatedAt": ""
  }
]
```

## GET /analytics/export

Query filters:

- `format`: `csv|pdf`

Response:

- `format=csv`: CSV file attachment
- `format=pdf`: JSON summary payload (simple mode)

## GET /analytics/impact/:postId

Path params:

- `postId`

Response data schema:

```json
{
  "heatmap": [{ "hour": 0, "value": 0.5 }],
  "explanation": "...",
  "metrics": { "reach": 0, "shares": 0, "likes": 0, "sentiment": "neutral" }
}
```

---

## 7. Nodes Library API

## GET /nodes

Query filters:

- `platform` (`all|linkedin|instagram|facebook|twitter`)
- `range` (`7d|14d|30d|90d`)
- `sortBy` (`engagement` maps to `engagementRate`)
- `sortOrder`
- `page`, `limit`

Response data schema:

```json
[
  {
    "id": "nodeId",
    "title": "Optimizing Peak Productivity",
    "platform": "instagram",
    "publishedAt": "2026-04-20T00:00:00.000Z",
    "engagementRate": 4.82,
    "reach": 12500,
    "isTopPerformer": true,
    "workflowStatus": "LIVE",
    "status": "published",
    "createdAt": "",
    "updatedAt": ""
  }
]
```

---

## 8. Campaign APIs

## GET /campaigns

Query filters:

- `status`: `LIVE|DRAFT|READY|PAUSED|COMPLETED`
- `q`, `page`, `limit`, `sortBy`, `sortOrder`

Response data schema:

```json
[
  {
    "id": "",
    "name": "",
    "objective": "reach",
    "status": "LIVE",
    "channels": ["instagram"],
    "collaborators": [{ "id": "", "name": "", "role": "editor" }],
    "goals": {
      "targetReach": 0,
      "currentReach": 0,
      "targetCount": 0,
      "currentCount": 0,
      "targetEngagementRate": 0,
      "currentEngagementRate": 0,
      "goalLabel": ""
    },
    "feedSummary": "",
    "startDate": "",
    "endDate": "",
    "createdAt": "",
    "updatedAt": ""
  }
]
```

## POST /campaigns

Request body:

```json
{
  "name": "",
  "objective": "reach",
  "status": "DRAFT",
  "channels": ["instagram"],
  "collaborators": [],
  "targetReach": 3000000,
  "startDate": "2026-04-20T00:00:00.000Z",
  "endDate": "2026-05-20T00:00:00.000Z"
}
```

Response: campaign object above.

## GET /campaigns/:id/timeline

Path params:

- `id` campaign id

Response data schema:

```json
{
  "campaign": { "id": "", "name": "", "status": "LIVE" },
  "timeline": [
    {
      "id": "postId",
      "campaignId": "",
      "title": "",
      "platform": "instagram",
      "status": "READY",
      "postStatus": "scheduled",
      "scheduledAt": "",
      "publishedAt": "",
      "createdAt": "",
      "updatedAt": ""
    }
  ]
}
```

## GET /campaigns/:id/analytics

Path params:

- `id` campaign id

Response data schema:

```json
{
  "campaign": { "id": "", "name": "", "status": "LIVE" },
  "summary": {
    "totalPosts": 0,
    "draftPosts": 0,
    "scheduledPosts": 0,
    "publishedPosts": 0,
    "failedPosts": 0,
    "totalReach": 0,
    "averageEngagementRate": 0
  },
  "platformBreakdown": [
    {
      "platform": "instagram",
      "count": 0,
      "reach": 0,
      "engagementRate": 0
    }
  ],
  "timeSeries": [
    { "date": "2026-04-20", "posts": 0, "published": 0, "reach": 0 }
  ]
}
```

---

## 9. Post Composer + Post APIs

## POST /posts

Request body:

```json
{
  "content": "",
  "platforms": ["instagram", "linkedin"],
  "mediaUrls": ["https://..."],
  "scheduledAt": "2026-04-21T09:00:00.000Z"
}
```

Alternative body:

```json
{
  "postId": "existingPostId",
  "scheduledAt": "2026-04-21T09:00:00.000Z"
}
```

Response data schema:

```json
{
  "created": [
    {
      "id": "",
      "platform": "instagram",
      "status": "scheduled",
      "workflowStatus": "READY"
    }
  ],
  "count": 1
}
```

## GET /posts

Query filters:

- `page`, `limit`, `status`, `platform`, `q`, `range`, `from`, `to`, `sortBy`, `sortOrder`

Response always uses the standard envelope (`{ success, data }`).

Post item schema:

```json
{
  "id": "",
  "userId": "",
  "campaignId": null,
  "platform": "instagram",
  "day": "Monday",
  "headline": "",
  "content": "",
  "points": [],
  "cta": "",
  "mediaUrls": [],
  "generatedImageUrl": null,
  "editedImageUrl": null,
  "status": "draft",
  "workflowStatus": "DRAFT",
  "scheduledTime": null,
  "scheduledAt": null,
  "publishedAt": null,
  "errorMessage": null,
  "aiProvider": null,
  "metrics": {
    "reach": 0,
    "engagementRate": 0,
    "likes": 0,
    "comments": 0,
    "shares": 0,
    "saves": 0,
    "sentiment": "neutral"
  },
  "isTopPerformer": false,
  "createdAt": "",
  "updatedAt": ""
}
```

## GET /posts/:id

Path params:

- `id`
  Response: post item schema above.

## PUT /posts/:id

Path params:

- `id`
  Request body: partial post fields
  Response: updated post item.

## DELETE /posts/:id

Path params:

- `id`
  Response data schema:

```json
{ "message": "Post deleted successfully" }
```

## POST /posts/batch

Request body:

```json
{
  "scheduledAt": "2026-04-21T09:00:00.000Z",
  "imageUrl": "https://...",
  "items": [
    {
      "platform": "instagram",
      "headline": "",
      "points": [],
      "cta": "",
      "caption": "",
      "day": "Monday"
    }
  ]
}
```

Response data schema:

```json
{
  "scheduledAt": "",
  "posts": [
    {
      "id": "",
      "platform": "instagram",
      "headline": "",
      "status": "scheduled",
      "scheduledAt": "",
      "imageUrl": "",
      "createdAt": ""
    }
  ]
}
```

## POST /posts/publish-now

Request body:

```json
{
  "caption": "",
  "imageUrl": "https://...",
  "platforms": ["instagram", "linkedin"]
}
```

Response data schema:

```json
{
  "results": [
    { "platform": "instagram", "status": "published" },
    { "platform": "linkedin", "status": "failed", "error": "..." }
  ]
}
```

## GET /posts/:id/analytics

Path params:

- `id`
  Response data schema:

```json
{
  "engagementVelocity": [{ "point": 1, "value": 4.2, "timestamp": "" }],
  "sentiment": { "positive": 78, "neutral": 16, "negative": 6 },
  "keyPhrases": ["growth", "campaign"],
  "conversions": { "downloads": 2410, "followers": 412 },
  "post": {}
}
```

---

## 10. Schedule Compatibility APIs

The same scheduler controller is mounted on `/schedule` for frontend compatibility.

Supported:

- `POST /schedule`
- `GET /schedule`
- `DELETE /schedule/:id`
- `POST /schedule/batch`

---

## 11. Competitor APIs

Accurate competitor ranking now follows this flow:

1. Configure explicit competitors using `/competitors/targets`
2. Sync or ingest real competitor posts (`/competitors/sync` or `/competitors/ingest`)
3. Read ranked output from `/competitors` and raw feed from `/competitors/feed`

No static seed competitors are auto-created.

## POST /competitors/discover

Discovers competitor candidates using:

1. Connected social platforms from the authenticated user (`socialConnections`)
2. Requested genre (for example: `fintech`, `beauty`, `fitness`, `saas marketing`)

By default, discovered competitors are auto-saved into targets.

Request body:

```json
{
  "genre": "fintech",
  "limit": 10,
  "saveTargets": true
}
```

Request fields:

- `genre` required string
- `limit` optional integer (1..25, default 10)
- `saveTargets` optional boolean (default true)

Response data schema:

```json
{
  "genre": "fintech",
  "connectedPlatforms": ["linkedin", "twitter"],
  "discovered": [
    {
      "competitorId": "stripe",
      "name": "Stripe",
      "platforms": ["linkedin", "twitter"],
      "handles": {
        "linkedin": "stripe",
        "twitter": "stripe"
      },
      "tags": ["payments", "finance"],
      "sourceConfidence": 86,
      "reason": "Matched genre keywords: fintech, payments; connected on linkedin, twitter"
    }
  ],
  "count": 1,
  "savedTargets": 1,
  "message": "Competitor candidates discovered from connected platforms and genre"
}
```

## GET /competitors/targets

Returns configured competitor targets for the authenticated user.

Response data schema:

```json
[
  {
    "id": "",
    "competitorId": "acme-growth",
    "name": "Acme Growth",
    "platforms": ["linkedin", "twitter"],
    "handles": {
      "linkedin": "acmegrowth",
      "twitter": "acmegrowth"
    },
    "tags": ["saas", "growth"],
    "active": true,
    "sourceConfidence": 90,
    "syncStatus": "ok",
    "syncMessage": null,
    "lastSyncedAt": "",
    "createdAt": "",
    "updatedAt": ""
  }
]
```

## POST /competitors/targets

Upserts one or many competitor targets.

Request body:

```json
{
  "items": [
    {
      "competitorId": "acme-growth",
      "name": "Acme Growth",
      "platforms": ["linkedin", "twitter"],
      "handles": {
        "linkedin": "acmegrowth",
        "twitter": "acmegrowth"
      },
      "tags": ["saas", "growth"],
      "active": true,
      "sourceConfidence": 90
    }
  ]
}
```

Response data schema:

```json
{
  "targets": [
    {
      "id": "",
      "competitorId": "acme-growth",
      "name": "Acme Growth",
      "platforms": ["linkedin", "twitter"],
      "handles": {
        "linkedin": "acmegrowth",
        "twitter": "acmegrowth"
      },
      "tags": ["saas", "growth"],
      "active": true,
      "sourceConfidence": 90,
      "syncStatus": "idle",
      "syncMessage": null,
      "lastSyncedAt": null,
      "createdAt": "",
      "updatedAt": ""
    }
  ],
  "count": 1
}
```

## DELETE /competitors/targets/:id

Deletes target by target ObjectId or `competitorId`.

Response data schema:

```json
{
  "id": "",
  "competitorId": "acme-growth",
  "deleted": true
}
```

## POST /competitors/sync

Strict sync endpoint for accurate competitor records.

- Requires `items[]`
- If active targets exist, rows not matching configured `competitorId` are skipped
- Deduplicates by `externalPostId` (or deterministic content hash when omitted)

Request body:

```json
{
  "items": [
    {
      "competitorId": "acme-growth",
      "author": "Acme Growth",
      "platform": "linkedin",
      "externalPostId": "urn:li:activity:123",
      "postUrl": "https://www.linkedin.com/...",
      "publishedAt": "2026-04-22T10:00:00.000Z",
      "content": "",
      "engagement": 7.4,
      "reach": 24000,
      "shares": 320,
      "confidence": 92,
      "tags": ["benchmark", "viral"]
    }
  ]
}
```

Response data schema:

```json
{
  "inserted": 12,
  "updated": 4,
  "skipped": 1,
  "invalid": 0,
  "warnings": []
}
```

## POST /competitors/ingest

Manual ingest endpoint (same shape as `/competitors/sync`).

- Supports optional `strictTargets` (default `true`)

## GET /competitors

Query filters:

- `range` (`7d|14d|30d|90d`, default backend window is 30d)

Response data schema:

```json
{
  "leaderboard": [
    {
      "id": "",
      "rank": 1,
      "name": "DataPulse Solutions",
      "avatar": "DA",
      "status": "aggressive",
      "isUser": false,
      "score": 82,
      "confidence": 91,
      "connectedPlatforms": ["linkedin"],
      "postsLast7d": 4,
      "successRate": "80%",
      "reach": "42k",
      "engagementRate": "8.20%",
      "sentiment": "88%",
      "shareOfVoice": "49%",
      "growth": "+8%",
      "isBenchmark": true
    }
  ],
  "insights": [
    {
      "id": "",
      "type": "opportunity",
      "title": "",
      "description": "",
      "message": ""
    }
  ],
  "userScore": 65,
  "userStats": {
    "totalPosts": 0,
    "publishedPosts": 0,
    "postsLast7d": 0,
    "connectedPlatforms": ["linkedin"],
    "successRate": 0
  },
  "radarData": {
    "userScore": [{ "label": "Reach", "value": 65 }],
    "benchmarkScore": [{ "label": "Reach", "value": 78 }]
  }
}
```

## GET /competitors/feed

Query filters:

- `platform=all|linkedin|instagram|facebook|twitter`
- `competitorId`
- `type` (example `viral`)
- `source=manual|sync|api`
- `range` (`7d|14d|30d|90d`)
- `page`, `limit`, `sortBy`, `sortOrder`

Response data schema:

```json
[
  {
    "id": "",
    "competitorId": "",
    "author": "DataPulse Solutions",
    "platform": "linkedin",
    "source": "sync",
    "externalPostId": "",
    "postUrl": "",
    "publishedAt": "",
    "confidence": 90,
    "content": "",
    "engagement": 8.2,
    "reach": 42100,
    "shares": 630,
    "createdAt": "",
    "updatedAt": "",
    "tags": ["viral"]
  }
]
```

Full response envelope also includes `pagination`, `filters`, and `sort`.

## GET /competitors/:id/analytics

Path params:

- `id` competitor id

Response data schema:

```json
{
  "competitor": {
    "id": "",
    "author": "",
    "name": "",
    "target": {
      "id": "",
      "competitorId": "",
      "name": ""
    }
  },
  "summary": {
    "averageEngagement": 7.5,
    "averageReach": 32000,
    "averageShares": 410,
    "averageConfidence": 88.3,
    "postCount": 12
  },
  "platformBreakdown": [{ "platform": "linkedin", "count": 5 }],
  "topTags": ["viral", "benchmark"],
  "trend": [
    {
      "point": 1,
      "date": "2026-04-20",
      "engagement": 8.2,
      "reach": 42100,
      "confidence": 91
    }
  ]
}
```

---

## 12. Insights API

## GET /insights

Response data schema:

```json
{
  "alerts": [],
  "recommendations": [],
  "opportunities": []
}
```

---

## 13. Bookmarks API

## POST /bookmarks

Request body:

```json
{
  "entityId": "",
  "type": "post",
  "title": "",
  "meta": {}
}
```

Response data schema:

```json
{
  "id": "",
  "entityId": "",
  "type": "post",
  "title": "",
  "meta": {},
  "createdAt": "",
  "updatedAt": ""
}
```

## GET /bookmarks

Query filters:

- `type`: `post|competitor|insight|project`
- `page`, `limit`, `sortBy`, `sortOrder`

## DELETE /bookmarks/:id

Path params:

- `id`

---

## 14. Activity Feed API (Critical)

## GET /activity

Query filters:

- `type`: `all|published|competitors|team|alerts` (category)
- `eventType`: `success|warning|error`
- `page`, `limit`, `sortBy`, `sortOrder`

Response data schema:

```json
[
  {
    "id": "",
    "type": "success",
    "category": "PUBLISHED",
    "title": "Instagram Post Successful",
    "description": "",
    "actor": "Sarah Chen",
    "timestamp": "",
    "meta": {},
    "createdAt": "",
    "updatedAt": ""
  }
]
```

---

## 15. Notification APIs

## GET /notifications

Query filters:

- `type`: `success|warning|error`
- `category`: `ALL|PUBLISHED|COMPETITORS|TEAM|ALERTS`
- `page`, `limit`, `sortBy`, `sortOrder`

Response data schema:

```json
[
  {
    "id": "",
    "type": "success",
    "category": "PUBLISHED",
    "title": "",
    "description": "",
    "message": "",
    "actor": "",
    "timestamp": "",
    "meta": {},
    "channels": ["in_app"],
    "isRead": false,
    "createdAt": "",
    "updatedAt": ""
  }
]
```

## PATCH /notifications/:id/read

Path params:

- `id`

Response data schema:

```json
{ "id": "", "isRead": true, "updatedAt": "" }
```

## DELETE /notifications/clear

Response data schema:

```json
{ "deletedCount": 3, "message": "Read notifications cleared" }
```

## POST /notifications/settings

Request body:

```json
{
  "email": true,
  "push": true,
  "inApp": true,
  "alerts": true,
  "competitors": true,
  "team": true,
  "published": true
}
```

Response data schema:

```json
{
  "notifications": {
    "email": true,
    "push": true,
    "inApp": true,
    "alerts": true,
    "competitors": true,
    "team": true,
    "published": true
  },
  "updatedAt": ""
}
```

---

## 16. Settings APIs

## GET /settings

Response data schema:

```json
{
  "profile": { "name": "", "email": "", "timezone": "UTC", "avatarUrl": null },
  "team": [
    { "id": "", "name": "", "email": "", "role": "owner", "status": "active" }
  ],
  "connectedChannels": [
    { "platform": "linkedin", "connected": true, "profileName": "" }
  ],
  "billing": { "plan": "Pro Curator", "status": "active" },
  "notifications": {
    "email": true,
    "push": true,
    "inApp": true,
    "alerts": true,
    "competitors": true,
    "team": true,
    "published": true
  },
  "support": {
    "contactEmail": "support@growmarket.ai",
    "prioritySupport": false
  },
  "createdAt": "",
  "updatedAt": ""
}
```

## PATCH /settings

Request body:

```json
{
  "profile": { "name": "", "email": "", "timezone": "" },
  "team": [],
  "notifications": {},
  "support": {}
}
```

Response data schema:

```json
{
  "profile": {},
  "team": [],
  "connectedChannels": [],
  "notifications": {},
  "support": {},
  "createdAt": "",
  "updatedAt": ""
}
```

---

## 17. Billing API

## GET /billing

Response data schema:

```json
{
  "plan": "Pro Curator",
  "price": 129,
  "currency": "USD",
  "billingCycle": "monthly",
  "usage": {
    "channelsUsed": 4,
    "channelsLimit": 5,
    "postsUsed": 45,
    "postsLimit": 100
  },
  "status": "active",
  "nextInvoiceDate": "",
  "createdAt": "",
  "updatedAt": ""
}
```

---

## 18. AI Content Project Pipeline (Refactored Existing Workflow)

This refactor keeps the existing content flow and adds a strict project-level workflow.

### Pipeline status order (strict)

`IDEA -> ANALYZED -> IMAGE_GENERATED -> EDITED -> CAPTION_GENERATED -> READY -> PUBLISHED`

Rules enforced:

- Transitions cannot skip forward or move backward
- Step guards validate allowed stage per endpoint
- Previous stage outputs are retained (history + grouped versioned assets)
- Workflow is resumable (`GET /ai/content/projects`, `GET /ai/content/projects/:id`)
- Manual and AI image paths are both supported
- Pipeline failures are tracked in `project.error` and can be retried via API

### Response requirement for project endpoints

Project-oriented responses include:

- `projectId`
- `status`
- `assets[]` grouped by source asset with `versions[]` history
- `captions[]` with selectable options (`isSelected`)
- optional `error` payload when a step fails

### POST /ai/content/batch

Body:

```json
{
  "items": [
    { "idea": "Build in public for SaaS founders" },
    { "idea": "Weekly B2B growth teardown" }
  ]
}
```

Response:

```json
{
  "count": 2,
  "projects": [{ "projectId": "", "status": "IDEA" }]
}
```

### POST /ai/content/idea

Body:

```json
{ "idea": "Build in public for SaaS founders" }
```

Response includes project root:

```json
{ "projectId": "", "status": "IDEA", "assets": [], "captions": [] }
```

### POST /ai/content/analyze

Body:

```json
{ "projectId": "" }
```

Response:

```json
{
  "projectId": "",
  "status": "ANALYZED",
  "assets": [],
  "analysis": {
    "targetAudience": "",
    "contentAngles": [],
    "hooks": [],
    "hashtags": []
  }
}
```

### POST /ai/content/generate-image

Body:

```json
{ "projectId": "", "style": "modern", "count": 3 }
```

Response:

```json
{
  "projectId": "",
  "status": "IMAGE_GENERATED",
  "assets": [
    { "id": "", "selected": true, "versions": [{ "id": "", "url": "" }] }
  ],
  "images": [{ "id": "", "url": "" }]
}
```

### POST /ai/content/select-image

Body:

```json
{ "projectId": "", "assetId": "" }
```

Response:

```json
{
  "projectId": "",
  "status": "EDITED",
  "selectedAssetId": "",
  "assets": []
}
```

### POST /content/upload-image (manual upload)

Content-Type: `multipart/form-data`

Fields:

- `projectId`
- `file` (image)

Response:

```json
{
  "projectId": "",
  "status": "EDITED",
  "assetId": "",
  "url": "",
  "assets": []
}
```

### POST /ai/content/edit-image (AI edit)

Body:

```json
{
  "projectId": "",
  "assetId": "",
  "prompt": "make it more vibrant and high contrast"
}
```

Response:

```json
{
  "projectId": "",
  "status": "EDITED",
  "editedUrl": "",
  "assets": []
}
```

### POST /ai/content/generate-caption

Body:

```json
{ "projectId": "", "tone": "professional", "count": 3 }
```

Response:

```json
{
  "projectId": "",
  "status": "CAPTION_GENERATED",
  "assets": [],
  "captions": [{ "id": "", "text": "", "isSelected": true, "hashtags": [] }],
  "caption": "",
  "hashtags": []
}
```

### POST /ai/content/:id/retry

Retries the last failed pipeline step tracked in `error.step`.

Response:

```json
{
  "retriedStep": "CAPTION",
  "projectId": "",
  "status": "CAPTION_GENERATED",
  "error": null
}
```

### POST /ai/content/caption-from-image

Body:

```json
{ "imageUrl": "", "platform": "instagram" }
```

Response:

```json
{
  "projectId": null,
  "status": null,
  "assets": [],
  "captions": [{ "id": "", "text": "", "isSelected": true, "hashtags": [] }],
  "caption": "",
  "hashtags": []
}
```

### POST /content/save-draft

Body:

```json
{
  "projectId": "",
  "caption": "",
  "assets": [{ "url": "" }],
  "platforms": ["instagram"]
}
```

Response:

```json
{ "projectId": "", "status": "READY", "assets": [] }
```

### POST /content/publish

Body:

```json
{
  "projectId": "",
  "platforms": ["instagram", "linkedin"],
  "scheduledAt": "2026-04-20T12:00:00.000Z",
  "campaignId": ""
}
```

Response:

```json
{
  "projectId": "",
  "status": "PUBLISHED",
  "assets": [],
  "postIds": ["", ""]
}
```

### Resumable project APIs

- `GET /ai/content/projects?status=READY&page=1&limit=10`
- `GET /ai/content/projects/:id`
- `POST /ai/content/projects/:id/duplicate`

Duplicate response contract:

```json
{
  "newProjectId": "",
  "status": "IDEA"
}
```

---

## 19. Existing Content/Image/Social APIs (Kept)

Kept for current frontend compatibility:

- `POST /content/generate`
- `POST /content/generate-idea`
- `POST /content/generate-weekly`
- `POST /content/generate-suggestions`
- `POST /image/generate`
- `POST /image/save`
- `POST /image/upload-custom`
- `GET /social-auth/status`
- `DELETE /social-auth/disconnect/:platform`
- OAuth redirect/callback routes under `/social-auth/*`

---

## 20. Realtime (WebSocket)

Connect to:

- `ws://localhost:3000/ws`

Message envelope:

```json
{
  "channel": "activity",
  "event": "created",
  "data": {},
  "timestamp": "2026-04-20T...Z"
}
```

Channels:

- `activity`
- `competitors`
- `notifications`
- `pipeline`
- `post`
- `analytics`

Events currently emitted:

- `activity: created`
- `competitors: feed_snapshot`
- `notifications: created`
- `notifications: read`
- `pipeline: updated`
- `pipeline: completed`
- `post: published`
- `analytics: updated`

---

## 21. Queue Workers

### Scheduler Worker

File: `src/jobs/scheduler.job.ts`

- Runs every minute
- Picks `GeneratedPost` where `status=scheduled` and `scheduledAt/scheduledTime <= now`
- Publishes via social service
- Updates post state to `published` + `workflowStatus=LIVE`
- Retries failures and marks failed posts

### Simple Queue Service

File: `src/services/simple-queue.service.ts`

- In-process async task queue for lightweight jobs
- Supports fire-and-forget and promise-based task execution
- No external dependency required

---

## 22. Middleware

### auth.middleware.ts

- Validates JWT
- Sets `req.userId`, `req.role`
- Supports `authenticate` and `protect` alias
- Provides `requireRole("owner")` / `requireRole("owner", "editor")` RBAC guards

### validate.middleware.ts

- Joi request validation: body, params, query

### error.middleware.ts

- Standardized app error responses
- Safe fallback for unhandled errors

---

## 23. Missing Features / Known Gaps

Because this backend was simplified per your request (no extra infrastructure services), these are intentionally lightweight:

1. Redis queue/cache:

- Replaced by in-process queue/cache (`simple-queue.service.ts`, `simple-cache.service.ts`)
- Suitable for single-instance deployments

2. Cloud media storage adapter:

- Current implementation stores media locally in `/uploads/designs`
- Cloudinary/S3 adapter is not enabled in this simple build

3. PDF export:

- `GET /analytics/export?format=pdf` returns structured JSON summary in simple mode
- Full binary PDF generation is not included

4. OAuth provider token verification:

- `/auth/oauth` is implemented for contract consistency
- Full provider-side token introspection is not enforced in simple mode

5. Multi-instance realtime scaling:

- Native WebSocket server works per instance
- No Redis pub/sub fan-out currently configured

---

## 24. Status Values Used

- Post `status`: `draft|scheduled|published|failed`
- Post `workflowStatus`: `DRAFT|READY|LIVE`
- ContentProject `status`: `IDEA|ANALYZED|IMAGE_GENERATED|EDITED|CAPTION_GENERATED|READY|PUBLISHED`
- Campaign `status`: `LIVE|DRAFT|READY|PAUSED|COMPLETED`
- Activity/Notification `type`: `success|warning|error`
- Activity/Notification categories: `ALL|PUBLISHED|COMPETITORS|TEAM|ALERTS`

All entities include IDs and timestamps.
