"use client";

import React, { useEffect, useState } from "react";
import { api, GeneratedPost } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import "../dashboard/Dashboard.css";
import "./campaignTimeline.css";

type Weekday = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

interface ActivityItem {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
  type?: string;
  platform?: string;
  createdAt?: string;
  scheduledDate?: string;
  eventDate?: string;
  timestamp?: string;
  meta?: { platform?: string };
}

interface DashboardOverview {
  growth?: number;
  activeUsers?: number;
  performance?: number;
}

interface MonthlyObjective {
  month?: string;
  targetReach?: number;
  postCount?: number;
  targetEngagementRate?: number;
}


function IconSearch(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M10.8 18.2a7.4 7.4 0 1 0 0-14.8 7.4 7.4 0 0 0 0 14.8Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M20.4 20.4l-3.9-3.9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}



const Settings = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
 const [dashboard, setDashboard] = useState<DashboardOverview | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
const [monthlyObjective, setMonthlyObjective] = useState<MonthlyObjective | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
const [profile, setProfile] = useState<any>(null);
  const [search, setSearch] = useState("");

  const draftPosts = posts.filter(
    (post) => post.status?.toUpperCase() === "DRAFT"
  );

  const publishedPosts = posts.filter(
    (post) => post.status?.toUpperCase() === "PUBLISHED"
  );

  const scheduledCampaigns = campaigns.filter(
    (c) => c.status?.toUpperCase() === "SCHEDULED"
  );

  const activeCampaigns = campaigns.filter(
    (c) =>
      c.status?.toUpperCase() === "LIVE" ||
      c.status?.toUpperCase() === "ACTIVE"
  );

  const filteredDraftPosts = draftPosts.filter((post) =>
    (post.title || post.headline || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const filteredScheduledCampaigns = scheduledCampaigns.filter((campaign) =>
    (campaign.name || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const filteredPublishedPosts = publishedPosts.filter((post) =>
    (post.title || post.headline || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );


  useEffect(() => {
    if (authLoading || !user) return;

    const currentMonth = new Date().toISOString().slice(0, 7);
    console.log(currentMonth);

    const fetchData = async () => {
      try {
        const [
  postsData,
  campaignsData,
  dashboardData,
  activityData,
  objectiveData,
  profileData,
] = await Promise.all([
  api.posts.list(),
  api.campaigns.list(),
  api.dashboard.overview(),
  api.activity.get(),
  api.campaigns.getObjective(currentMonth).catch((err) => {
    console.error("Failed to fetch objective:", err);
    return null;
  }),
  api.auth.profile(),
]);

        console.log("Posts:", postsData);
        console.log("Campaigns:", campaignsData);
        console.log("Dashboard:", dashboardData);
        console.log("Activity:", JSON.stringify(activityData, null, 2));
        console.log("Objective:", objectiveData);

        setPosts(postsData);
        setCampaigns(campaignsData);
        setDashboard(dashboardData);
        setActivity(Array.isArray(activityData) ? activityData : []);
        setMonthlyObjective(objectiveData);
        setProfile(profileData);

      } catch (err: any) {
        console.error(err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading, user]);

  if (authLoading || loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!user) {
    return null;
  }

  const getActivityDate = (item: ActivityItem): Date | null => {
    const dateStr =
      item.createdAt ||
      item.scheduledDate ||
      item.eventDate ||
      item.timestamp;
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const getWeekdayFromDate = (date: Date): Weekday => {
    return date
      .toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })
      .toUpperCase() as Weekday;
  };

  const getActivitiesForDay = (day: Weekday): ActivityItem[] => {
    return activity.filter((item) => {
      const date = getActivityDate(item);
      if (!date) return false;
      return getWeekdayFromDate(date) === day;
    });
  };

  const getDayNumber = (day: Weekday, dayCampaign?: { startDate?: string }) => {
    if (dayCampaign?.startDate) {
      return new Date(dayCampaign.startDate).getDate();
    }
    const dayActivities = getActivitiesForDay(day);
    if (dayActivities.length > 0) {
      const date = getActivityDate(dayActivities[0]);
      if (date) return date.getDate();
    }
    return "-";
  };

  const getActivityPlatform = (item: ActivityItem): string => {
    const platform = item.meta?.platform || item.platform;
    if (platform) return platform.toUpperCase();
    if (item.type) return item.type.toUpperCase();
    return "INTERNAL";
  };

  const renderActivityCard = (item: ActivityItem) => (
    <div
      key={item._id || item.id}
      className="settings-event settings-event-muted"
    >
      <div className="settings-event-title">
        {item.title || item.name || "Untitled Activity"}
      </div>

      <div className="settings-event-meta settings-event-meta-muted">
        <span className="settings-dot settings-dot-gray" />
        <span>{getActivityPlatform(item)}</span>
      </div>
    </div>
  );

  const getCampaignForDay = (day: Weekday) => {
    return campaigns.find((campaign) => {
      if (!campaign.startDate) return false;
      const date = new Date(campaign.startDate);
      const campaignDay = date.toLocaleDateString("en-US", {
        weekday: "short",
        timeZone: "UTC"
      }).toUpperCase();
      return campaignDay === day;
    });
  };

  const getChannelIcon = (platform?: string) => {
    const p = platform?.toLowerCase() || "";
    if (p === "instagram") return "/assets/instagram.png";
    if (p === "linkedin") return "/assets/linkedin2.png";
    if (p === "twitter" || p === "x") return "/assets/twitter.png";
    if (p === "facebook") return "/assets/linked.png";
    return "/assets/instagram.png";
  };

  const monCampaign = getCampaignForDay("MON");
  const tueCampaign = getCampaignForDay("TUE");
  const wedCampaign = getCampaignForDay("WED");
  const thuCampaign = getCampaignForDay("THU");
  const friCampaign = getCampaignForDay("FRI");
  const satCampaign = getCampaignForDay("SAT");
  const sunCampaign = getCampaignForDay("SUN");

  const totalReach = publishedPosts.reduce(
    (sum, post) => sum + (post.reach || 0),
    0
  );

  const avgEngagement =
    publishedPosts.length > 0
      ? (
          publishedPosts.reduce(
            (sum, post) => sum + (post.engagementRate || 0),
            0
          ) / publishedPosts.length
        ).toFixed(2)
      : "0";



return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="brand-header">
                  <span className="brand-main">GrowMarkt</span>
          <span className="brand-subtitle">THE DATA CURATOR</span>
  
        </div>

        <nav>
          <ul>
            <li onClick={() => router.push("/dashboard")} style={{ cursor: "pointer" }}>
              <img src="/assets/dashboard.png" alt="dashboard" className="nav-icon" />
              DASHBOARD
            </li>

            <li className="active">
              <img src="/assets/campaign.png" alt="campaign" className="nav-icon" />
              CAMPAIGN MANAGER
            </li>

<li onClick={() => router.push("/analytics")} style={{ cursor: "pointer" }}>
  <img src="/assets/analytics.png" alt="analytics" className="nav-icon" />
  ANALYTICS
</li>

<li onClick={() => router.push("/competitor-analysis")} style={{ cursor: "pointer" }}>
  <img src="/assets/competition.png" alt="competitors" className="nav-icon" />
  COMPETITORS
</li>

<li onClick={() => router.push("/settings")} style={{ cursor: "pointer" }}>
  <img src="/assets/settings.png" alt="settings" className="nav-icon" />
  SETTINGS
</li>
          </ul>
        </nav>

        <button className="campaign-btn">+ NEW CAMPAIGN</button>
      </aside>

      <main className="main">
        <div className="topbar">

<div className="settings-search-container">
  <span className="settings-search-icon">
<IconSearch />
  </span>
<input
    value={search}
    onChange={(e)=>setSearch(e.target.value)}
    placeholder="Search..."
/>
</div>

          <div className="user-profile">

            <div className="user-profile-left">

              <div className="notif-icon">
                <img src="/assets/bell.png" alt="notification" />
                <span className="dot"></span>
              </div>

              <div className="profile-info">
<p className="user-name">
  {profile?.name || (user as any)?.name}
</p>

<p className="user-role">
  {profile?.email || "Premium Curator"}
</p>
              </div>

            </div>

            <img
  src="/assets/alex.jpg"
  alt="avatar"
  className="avatar"
/>

          </div>

        </div>

        <div className="page-content">
        <div className="settings-main">
       <div className="campaign-header">
  
  <div className="campaign-header-left">
    <div className="settings-kicker">STRATEGIC WORKSPACE</div>
    <div className="settings-title">Campaign Timeline</div>
    <div className="settings-subtitle">
      Strategic content distribution and multi-channel orchestration
    </div>
  </div>

  <div className="campaign-header-right">
    
    <div className="segment-control">
      <button className="segment-btn segment-btn-active">DAYS</button>
      <button className="segment-btn">
        MONTHLY
      </button>
<button className="segment-btn segment-channels">
  <img src="/assets/channel.png" alt="channel" className="btn-icon" />
  CHANNELS
</button>
    </div>

<button
  className="primary-action-btn"
  onClick={() => router.push("/create-unified-post")}
>
  <img src="/assets/plus.png" alt="plus" className="btn-icon" />
  CREATE CAMPAIGN
</button>

  </div>

        </div>

        <section className="settings-timeline">
          <div className="settings-day">
            <div className="settings-day-top">
              <div className="settings-day-name">MON</div>
              <div className="settings-day-num">{getDayNumber("MON", monCampaign)}</div>
            </div>

            {monCampaign && (
              <div className="settings-event settings-event-live">
                <div className="settings-pill settings-pill-live">
                  {monCampaign.status}
                </div>
                <div className="settings-event-title">{monCampaign.name}</div>
                <div className="settings-event-meta">
                  <span className="settings-dot settings-dot-green" />
                  <img
                    src={getChannelIcon(monCampaign.channels?.[0])}
                    alt={monCampaign.channels?.[0] || "Channel"}
                    className="settings-dot settings-dot-blue"
                  />
                  <span>
                    {monCampaign.channels?.[0]?.toUpperCase() || "CHANNEL"}
                  </span>
                </div>
              </div>
            )}

            {getActivitiesForDay("MON")
              .filter(
                (item) =>
                  (item.title || item.name || "").trim().toLowerCase() !==
                  "campaign created"
              )
              .map(renderActivityCard)}
          </div>

          <div className="settings-day">
            <div className="settings-day-top">
              <div className="settings-day-name">TUE</div>
              <div className="settings-day-num">{getDayNumber("TUE", tueCampaign)}</div>
            </div>

            {tueCampaign ? (
              <div className="settings-event">
                <div className="settings-pill settings-pill-draft">
                  {tueCampaign.status}
                </div>
                <div className="settings-event-title">{tueCampaign.name}</div>
                <div className="settings-event-meta">
                  <img
                    src={getChannelIcon(tueCampaign.channels?.[0])}
                    alt={tueCampaign.channels?.[0] || "Channel"}
                    className="settings-dot settings-dot-blue"
                  />
                  <span>
                    {tueCampaign.channels?.[0]?.toUpperCase() || "CHANNEL"}
                  </span>
                </div>
              </div>
            ) : null}

            {[
              ...getActivitiesForDay("TUE"),
              ...activity.filter(
                (item) =>
                  (item.title || item.name || "").trim().toLowerCase() ===
                    "campaign created" &&
                  !getActivitiesForDay("TUE").some(
                    (tueItem) =>
                      (tueItem._id || tueItem.id) === (item._id || item.id)
                  )
              ),
            ].map(renderActivityCard)}

            {!tueCampaign &&
              getActivitiesForDay("TUE").length === 0 &&
              !activity.some(
                (item) =>
                  (item.title || item.name || "").trim().toLowerCase() ===
                  "campaign created"
              ) && (
              <div className="settings-empty">
                <div className="settings-empty-title">No events</div>
                <div className="settings-empty-sub">scheduled</div>
              </div>
            )}
          </div>

          <div className="settings-day settings-day-active">
            <div className="settings-day-top">
              <div className="settings-day-name">WED</div>
              <div className="settings-day-num">{getDayNumber("WED", wedCampaign)}</div>
            </div>

            {wedCampaign ? (
              <div className="settings-event settings-event-dark">
                <div className="settings-pill settings-pill-plan">
                  {wedCampaign.status}
                </div>
                <div className="settings-event-title">{wedCampaign.name}</div>
                <div className="settings-event-meta">
                  <img
                    src={getChannelIcon(wedCampaign.channels?.[0])}
                    alt={wedCampaign.channels?.[0] || "Channel"}
                    className="settings-dot settings-dot-blue"
                  />
                  <span>
                    {wedCampaign.channels?.[0]?.toUpperCase() || "CHANNEL"}
                  </span>
                </div>
              </div>
            ) : null}

            {getActivitiesForDay("WED").map(renderActivityCard)}

            {!wedCampaign && getActivitiesForDay("WED").length === 0 && (
              <div className="settings-empty">
                <div className="settings-empty-title">No events</div>
                <div className="settings-empty-sub">scheduled</div>
              </div>
            )}
          </div>

          <div className="settings-day">
            <div className="settings-day-top">
              <div className="settings-day-name">THU</div>
              <div className="settings-day-num">{getDayNumber("THU", thuCampaign)}</div>
            </div>

            {thuCampaign ? (
              <div className="settings-event">
                <div className="settings-pill">{thuCampaign.status}</div>
                <div className="settings-event-title">{thuCampaign.name}</div>
                <div className="settings-event-meta">
                  <img
                    src={getChannelIcon(thuCampaign.channels?.[0])}
                    alt={thuCampaign.channels?.[0] || "Channel"}
                    className="settings-dot settings-dot-blue"
                  />
                  <span>
                    {thuCampaign.channels?.[0]?.toUpperCase() || "CHANNEL"}
                  </span>
                </div>
              </div>
            ) : null}

            {getActivitiesForDay("THU")
  .filter(
    (item) =>
      (item.title || item.name || "").trim().toLowerCase() !==
      "campaign created"
  )
  .map(renderActivityCard)}

            {!thuCampaign && getActivitiesForDay("THU").length === 0 && (
              <div className="settings-empty">
                <div className="settings-empty-title">No events</div>
                <div className="settings-empty-sub">scheduled</div>
              </div>
            )}
          </div>

          <div className="settings-day">
            <div className="settings-day-top">
              <div className="settings-day-name">FRI</div>
              <div className="settings-day-num">{getDayNumber("FRI", friCampaign)}</div>
            </div>

            {friCampaign ? (
              <div className="settings-event">
                <div className="settings-pill settings-pill-ready">
                  {friCampaign.status}
                </div>
                <div className="settings-event-title">{friCampaign.name}</div>
                <div className="settings-event-meta">
                  <img
                    src={getChannelIcon(friCampaign.channels?.[0])}
                    alt={friCampaign.channels?.[0] || "Channel"}
                    className="settings-dot settings-dot-blue"
                  />
                  <span>
                    {friCampaign.channels?.[0]?.toUpperCase() || "CHANNEL"}
                  </span>
                </div>
              </div>
            ) : null}

            {getActivitiesForDay("FRI").map(renderActivityCard)}

            {!friCampaign && getActivitiesForDay("FRI").length === 0 && (
              <div className="settings-empty">
                <div className="settings-empty-title">No events</div>
                <div className="settings-empty-sub">scheduled</div>
              </div>
            )}
          </div>

          <div className="settings-day">
            <div className="settings-day-top">
              <div className="settings-day-name">SAT</div>
              <div className="settings-day-num">{getDayNumber("SAT", satCampaign)}</div>
            </div>

            {satCampaign ? (
              <div className="settings-event">
                <div className="settings-pill">{satCampaign.status}</div>
                <div className="settings-event-title">{satCampaign.name}</div>
                <div className="settings-event-meta">
                  <img
                    src={getChannelIcon(satCampaign.channels?.[0])}
                    alt={satCampaign.channels?.[0] || "Channel"}
                    className="settings-dot settings-dot-blue"
                  />
                  <span>
                    {satCampaign.channels?.[0]?.toUpperCase() || "CHANNEL"}
                  </span>
                </div>
              </div>
            ) : null}

            {getActivitiesForDay("SAT").map(renderActivityCard)}

            {!satCampaign && getActivitiesForDay("SAT").length === 0 && (
              <div className="settings-add">
                <div className="settings-add-btn">+</div>
              </div>
            )}
          </div>

          <div className="settings-day">
            <div className="settings-day-top">
              <div className="settings-day-name">SUN</div>
              <div className="settings-day-num">{getDayNumber("SUN", sunCampaign)}</div>
            </div>

            {sunCampaign ? (
              <div className="settings-event">
                <div className="settings-pill">{sunCampaign.status}</div>
                <div className="settings-event-title">{sunCampaign.name}</div>
                <div className="settings-event-meta">
                  <img
                    src={getChannelIcon(sunCampaign.channels?.[0])}
                    alt={sunCampaign.channels?.[0] || "Channel"}
                    className="settings-dot settings-dot-blue"
                  />
                  <span>
                    {sunCampaign.channels?.[0]?.toUpperCase() || "CHANNEL"}
                  </span>
                </div>
              </div>
            ) : null}

            {getActivitiesForDay("SUN").map(renderActivityCard)}

            {!sunCampaign && getActivitiesForDay("SUN").length === 0 && (
              <div className="settings-empty settings-empty-right">
                <div className="settings-empty-title">No events</div>
                <div className="settings-empty-sub">scheduled</div>
              </div>
            )}
          </div>
        </section>

        <section className="settings-kpis">
          <div className="settings-kpi">
            <div className="settings-kpi-top">
              <div className="settings-kpi-label">SCHEDULED VOLUME</div>
              <div className="settings-kpi-ico">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4.8 16.4 10 11.2l3.1 3.1L19.2 8.2"
                    stroke="#16A34A"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M19.2 8.2h-4"
                    stroke="#16A34A"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
            <div className="settings-kpi-value">
              <span className="settings-kpi-big">{scheduledCampaigns.length}</span>
              <span className="settings-kpi-delta">{dashboard?.growth ?? 0}%</span>
            </div>
            <div className="settings-mini-bars">
              <span className="settings-mini-bar" />
              <span className="settings-mini-bar" />
              <span className="settings-mini-bar" />
              <span className="settings-mini-bar" />
              <span className="settings-mini-bar settings-mini-bar-strong" />
              <span className="settings-mini-bar" />
              <span className="settings-mini-bar" />
            </div>
          </div>

          <div className="settings-kpi">
            <div className="settings-kpi-top">
              <div className="settings-kpi-label">ACTIVE USERS</div>
              <div className="settings-kpi-ico settings-kpi-ico-blue">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 13.2a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z"
                    stroke="#2563EB"
                    strokeWidth="2"
                  />
                  <path
                    d="M5 20.2c.9-3.2 3.3-4.9 7-4.9s6.1 1.7 7 4.9"
                    stroke="#2563EB"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
            <div className="settings-kpi-value">
              <span className="settings-kpi-big">{activeCampaigns.length}</span>
              <span className="settings-live">LIVE</span>
            </div>
            <div className="settings-avatars">
<img
  src="/assets/user1.jpg"
  alt="User 1"
  className="settings-av settings-av-1"
/>

<img
  src="/assets/girl.jpg"
  alt="Girl"
  className="settings-av settings-av-2"
/>

<img
  src="/assets/alex.jpg"
  alt="Alex"
  className="settings-av settings-av-3"
/>
              <span className="settings-av settings-av-more">+{dashboard?.activeUsers ?? 0}</span>
            </div>
          </div>

          <div className="settings-kpi">
            <div className="settings-kpi-top">
              <div className="settings-kpi-label">ACTIVE CAMPAIGNS</div>
              <div className="settings-kpi-ico">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6.2 17.9V10.8m5.9 7.1V6.2m5.7 11.7v-9.3"
                    stroke="#0F172A"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
            <div className="settings-kpi-value">
              <span className="settings-kpi-big">{activeCampaigns.length}</span>
              <span className="settings-kpi-sub">Global Ops</span>
            </div>
            <div className="settings-progress">
              <div className="settings-progress-top">
                <span>PERFORMANCE TARGET</span>
                <span>{dashboard?.performance ?? 0}% ACHIEVED</span>
              </div>
<div className="settings-progress-bar">
  <div
    className="settings-progress-fill"
    style={{
      width: `${dashboard?.performance ?? 0}%`,
    }}
  />
</div>
            </div>
          </div>
        </section>

<section className="settings-goals">
  <div className="settings-goals-top">
    <div>
      <div className="settings-section-title">
        Monthly Campaign Goals
      </div>

      <div className="settings-section-sub">
        Strategic objectives for{" "}
        {monthlyObjective?.month
          ? new Date(monthlyObjective.month + "-01").toLocaleString("en-US", {
              month: "long",
              year: "numeric",
            })
          : "July 2026"}
      </div>
    </div>

    <button
      className="settings-goals-btn"
      onClick={() => {
        window.scrollTo(0, 0);
        router.push("/monthly-objective");
      }}
    >
      SET NEW OBJECTIVE
    </button>
  </div>

  {!monthlyObjective ? (
    <div className="settings-goal-grid">
      <div
        className="settings-goal"
        style={{
          gridColumn: "1 / -1",
          textAlign: "center",
          padding: "50px 20px",
        }}
      >
        <div
          className="settings-section-title"
          style={{ marginBottom: "10px" }}
        >
          No Monthly Objective Found
        </div>

        <div className="settings-section-sub">
          Click <strong>SET NEW OBJECTIVE</strong> to create your first monthly
          campaign goal.
        </div>
      </div>
    </div>
  ) : (
    <>
      <div className="settings-goal-grid">
        <div className="settings-goal">
          <div className="settings-goal-head">
            <div className="settings-goal-label">TARGET REACH</div>
            <div className="settings-goal-state settings-state-ok">
              ON TRACK
            </div>
          </div>

          <div className="settings-goal-value">
            <span className="settings-goal-big">
              {monthlyObjective?.targetReach ?? 0}
            </span>
            <span className="settings-goal-small">goal</span>
          </div>

          <div className="settings-goal-bar">
            <div
              className="settings-goal-fill settings-goal-fill-blue"
              style={{
                width: `${
                  monthlyObjective?.targetReach
                    ? Math.min(
                        (totalReach / monthlyObjective.targetReach) * 100,
                        100
                      )
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        <div className="settings-goal">
          <div className="settings-goal-head">
            <div className="settings-goal-label">POST COUNT</div>
            <div className="settings-goal-state settings-state-risk">
              AT RISK
            </div>
          </div>

          <div className="settings-goal-value">
            <span className="settings-goal-big">
              {monthlyObjective?.postCount ?? 0}
            </span>
            <span className="settings-goal-small">goal</span>
          </div>

          <div className="settings-goal-bar">
            <div
              className="settings-goal-fill settings-goal-fill-slate"
              style={{
                width: `${
                  monthlyObjective?.postCount
                    ? Math.min(
                        (posts.length / monthlyObjective.postCount) * 100,
                        100
                      )
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        <div className="settings-goal">
          <div className="settings-goal-head">
            <div className="settings-goal-label">
              ENGAGEMENT RATE
            </div>
            <div className="settings-goal-state settings-state-good">
              EXCEEDING
            </div>
          </div>

          <div className="settings-goal-value">
            <span className="settings-goal-big">
              {monthlyObjective?.targetEngagementRate ?? 0}
            </span>
            <span className="settings-goal-small">goal</span>
          </div>

          <div className="settings-goal-bar">
            <div
              className="settings-goal-fill settings-goal-fill-green"
              style={{
                width: `${
                  monthlyObjective?.targetEngagementRate
                    ? Math.min(
                        (Number(avgEngagement) /
                          monthlyObjective.targetEngagementRate) *
                          100,
                        100
                      )
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      </div>
    </>
  )}
</section>
        <section className="settings-feed">
          <div className="settings-feed-top">
            <div className="settings-section-title">Campaign Feed</div>
            <div className="settings-feed-toggle">
              <button className="settings-feed-pill settings-feed-pill-active">ALL STATES</button>
              <button className="settings-feed-pill">BY PLATFORM</button>
            </div>
          </div>

          <div className="settings-feed-grid">
<div className="settings-feed-col">
  <div className="settings-feed-colhead">
  DRAFTS ({filteredDraftPosts.length})
  </div>

 {filteredDraftPosts.map((post) => (
    <div
      key={post._id}
      className="settings-feed-card settings-feed-card-draft"
    >
      <div className="settings-feed-row">
        <div className="settings-feed-left">
          <div className="settings-feed-ico">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M7 4.8h10a2 2 0 0 1 2 2v12.4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6.8a2 2 0 0 1 2-2Z"
                stroke="#0F172A"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M8.2 9.2h7.6M8.2 12.3h5.8"
                stroke="#0F172A"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="settings-feed-meta">
<div className="settings-feed-title">
  {post.title || post.headline}
</div>

            <div className="settings-feed-sub">
                {post.description || post.content}
            </div>
          </div>
        </div>

        <div className="settings-feed-tag settings-tag-draft">
          {post.status}
        </div>
      </div>

      <div className="settings-feed-foot">
        {post.createdAt
          ? `Edited ${new Date(post.createdAt).toLocaleDateString()}`
          : "Recently edited"}
      </div>
    </div>
  ))}
</div>
         

            <div className="settings-feed-col">
  <div className="settings-feed-colhead settings-feed-colhead-mid">
    SCHEDULED ({scheduledCampaigns.length})
  </div>

 {filteredScheduledCampaigns.map((campaign)=>(
    <div
      key={campaign._id}
      className="settings-feed-card settings-feed-card-scheduled"
    >
      <div className="settings-feed-row">
        <div className="settings-feed-left">
          <div className="settings-feed-ico settings-feed-ico-green">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M7 5.3h10a2 2 0 0 1 2 2v10.4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7.3a2 2 0 0 1 2-2Z"
                stroke="#16A34A"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M8.2 12.2h7.6"
                stroke="#16A34A"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M12 8.6v7.2"
                stroke="#16A34A"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="settings-feed-meta">
            <div className="settings-feed-title">
              {campaign.name}
            </div>
          </div>
        </div>

        <div className="settings-feed-tag settings-tag-scheduled">
          {campaign.status}
        </div>
      </div>

<img
  src={campaign.imageUrl || campaign.image || "/assets/schedule.png"}
  alt={campaign.name}
  className="settings-feed-thumb"
/>

      <div className="settings-feed-foot settings-feed-foot-green">
        {campaign.startDate
          ? new Date(campaign.startDate).toLocaleString()
          : "Not Scheduled"}
      </div>
    </div>
  ))}
</div>

            <div className="settings-feed-col">
  <div className="settings-feed-colhead">
    PUBLISHED ({publishedPosts.length})
  </div>

{filteredPublishedPosts.map((post) => (
    <div
      key={post._id}
      className="settings-feed-card settings-feed-card-pub"
    >
      <div className="settings-feed-row">
        <div className="settings-feed-left">
          <div className="settings-feed-ico settings-feed-ico-blue">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M7.4 16.8h9.2a2 2 0 0 0 2-2V8.1a2 2 0 0 0-2-2H7.4a2 2 0 0 0-2 2v6.7a2 2 0 0 0 2 2Z"
                stroke="#2563EB"
                strokeWidth="1.8"
              />
              <path
                d="M8.4 11.2h7.2"
                stroke="#2563EB"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="settings-feed-meta">
<div className="settings-feed-title">
  {post.title || post.headline}
</div>
          </div>
        </div>

        <div className="settings-feed-tag settings-tag-pub">
          {post.status}
        </div>
      </div>

      <div className="settings-feed-metrics">
        <div className="settings-metric">
          <div className="settings-metric-l">REACH</div>
          <div className="settings-metric-v">
            {post.reach ?? "0"}
          </div>
        </div>

        <div className="settings-metric">
          <div className="settings-metric-l">ENG</div>
          <div className="settings-metric-v">
            {post.engagementRate
              ? `${post.engagementRate}%`
              : "0%"}
          </div>
        </div>

        <div className="settings-metric">
          <div className="settings-metric-l">SHARES</div>
          <div className="settings-metric-v">
            {post.shares ?? "0"}
          </div>
        </div>
      </div>
    </div>
  ))}
</div>
          </div>
        </section>
        </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;