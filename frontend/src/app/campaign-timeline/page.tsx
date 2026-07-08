"use client";

import React, { useEffect, useState } from "react";
import { api, GeneratedPost } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import "../dashboard/Dashboard.css";
import "./campaignTimeline.css";


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

const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

const [search, setSearch] = useState("");

const filteredPosts = posts.filter(post =>
  post.title.toLowerCase().includes(search.toLowerCase())
);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (authLoading || !user) return;

    const fetchData = async () => {
      try {
const [postsData, campaignsData] =
await Promise.all([
api.posts.list(),
api.campaigns.list(),
]);

          console.log("Posts:", postsData);
console.log("Campaigns:", JSON.stringify(campaignsData, null, 2));
console.log("Objective Data");



        setPosts(postsData);
        setCampaigns(campaignsData);

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

const getCampaignForDay = (day: string) => {
  return campaigns.find((campaign) => {
    const campaignDay = new Date(campaign.startDate)
      .toLocaleDateString("en-US", { weekday: "short" })
      .toUpperCase();

    return campaignDay === day;
  });
};

const monCampaign = getCampaignForDay("MON");
const tueCampaign = getCampaignForDay("TUE");
const wedCampaign = getCampaignForDay("WED");
const thuCampaign = getCampaignForDay("THU");
const friCampaign = getCampaignForDay("FRI");
const satCampaign = getCampaignForDay("SAT");
const sunCampaign = getCampaignForDay("SUN");

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
<p className="user-name">{user.name}</p>

<p className="user-role">{user.role}</p>
              </div>

            </div>

            <img
   src={user.profileImage || "/assets/alex.jpg"}
   alt={user.name}
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
      <button className="segment-btn" onClick={() => router.push("/monthly-objective")}>
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
<div className="settings-day-name">
  MON
</div>
 <div className="settings-day-num">
  {monCampaign ? new Date(monCampaign.startDate).getDate() : 12}
</div>
            </div>
            <div className="settings-event settings-event-live">
<div className="settings-pill settings-pill-live">
  {monCampaign?.status ?? "LIVE"}
</div>
<div className="settings-event-title">
  {monCampaign?.name ?? "Spring Collection Launch Video"}
</div>
              <div className="settings-event-meta">
                <span className="settings-dot settings-dot-green" />
                                    <img
  src="/assets/instagram.png"
  alt="Instagram"
  className="settings-dot settings-dot-blue"
/>
<span>
  {monCampaign?.channels?.[0]?.toUpperCase() ?? "INSTAGRAM"}
</span>
              </div>
            </div>
            <div className="settings-event settings-event-muted">
              <div className="settings-event-title">Influencer Briefing</div>
              <div className="settings-event-meta settings-event-meta-muted">
                <span className="settings-dot settings-dot-gray" />

                <span>INTERNAL</span>
              </div>
            </div>
          </div>

<div className="settings-day">
  <div className="settings-day-top">
    <div className="settings-day-name">TUE</div>
    <div className="settings-day-num">
      {tueCampaign ? new Date(tueCampaign.startDate).getDate() : "-"}
    </div>
  </div>

  {tueCampaign ? (
    <div className="settings-event">
      <div className="settings-pill settings-pill-draft">
        {tueCampaign.status}
      </div>

      <div className="settings-event-title">
        {tueCampaign.name}
      </div>

      <div className="settings-event-meta">
        <span className="settings-dot settings-dot-blue" />
        <span>
          {tueCampaign.channels?.[0]?.toUpperCase() || "CHANNEL"}
        </span>
      </div>
    </div>
  ) : (
    <div className="settings-empty">
      <div className="settings-empty-title">No events</div>
      <div className="settings-empty-sub">scheduled</div>
    </div>
  )}
</div>

          <div className="settings-day settings-day-active">
  <div className="settings-day-top">
    <div className="settings-day-name">WED</div>
    <div className="settings-day-num">
      {wedCampaign ? new Date(wedCampaign.startDate).getDate() : "-"}
    </div>
  </div>

  {wedCampaign ? (
    <div className="settings-event settings-event-dark">
      <div className="settings-pill settings-pill-plan">
        {wedCampaign.status}
      </div>

      <div className="settings-event-title">
        {wedCampaign.name}
      </div>

      <div className="settings-event-meta">
        <span>
          {wedCampaign.channels?.[0]?.toUpperCase() || "CHANNEL"}
        </span>
      </div>
    </div>
  ) : (
    <div className="settings-empty">
      <div className="settings-empty-title">No events</div>
      <div className="settings-empty-sub">scheduled</div>
    </div>
  )}
</div>
          <div className="settings-day">
  <div className="settings-day-top">
    <div className="settings-day-name">THU</div>
    <div className="settings-day-num">
      {thuCampaign ? new Date(thuCampaign.startDate).getDate() : "-"}
    </div>
  </div>

  {thuCampaign ? (
    <div className="settings-event">
      <div className="settings-pill">
        {thuCampaign.status}
      </div>

      <div className="settings-event-title">
        {thuCampaign.name}
      </div>

      <div className="settings-event-meta">
        <span>
          {thuCampaign.channels?.[0]?.toUpperCase() || "CHANNEL"}
        </span>
      </div>
    </div>
  ) : (
    <div className="settings-empty">
      <div className="settings-empty-title">No events</div>
      <div className="settings-empty-sub">scheduled</div>
    </div>
  )}
</div>

          <div className="settings-day">
  <div className="settings-day-top">
    <div className="settings-day-name">FRI</div>
    <div className="settings-day-num">
      {friCampaign ? new Date(friCampaign.startDate).getDate() : "-"}
    </div>
  </div>

  {friCampaign ? (
    <div className="settings-event">
      <div className="settings-pill settings-pill-ready">
        {friCampaign.status}
      </div>

      <div className="settings-event-title">
        {friCampaign.name}
      </div>

      <div className="settings-event-meta">
        <span>
          {friCampaign.channels?.[0]?.toUpperCase() || "CHANNEL"}
        </span>
      </div>
    </div>
  ) : (
    <div className="settings-empty">
      <div className="settings-empty-title">No events</div>
      <div className="settings-empty-sub">scheduled</div>
    </div>
  )}
</div>

          <div className="settings-day">
  <div className="settings-day-top">
    <div className="settings-day-name">SAT</div>
    <div className="settings-day-num">
      {satCampaign ? new Date(satCampaign.startDate).getDate() : "-"}
    </div>
  </div>

  {satCampaign ? (
    <div className="settings-event">
      <div className="settings-pill">
        {satCampaign.status}
      </div>

      <div className="settings-event-title">
        {satCampaign.name}
      </div>

      <div className="settings-event-meta">
        <span>
          {satCampaign.channels?.[0]?.toUpperCase() || "CHANNEL"}
        </span>
      </div>
    </div>
  ) : (
    <div className="settings-add">
      <div className="settings-add-btn">+</div>
    </div>
  )}
</div>

          <div className="settings-day">
  <div className="settings-day-top">
    <div className="settings-day-name">SUN</div>
    <div className="settings-day-num">
      {sunCampaign ? new Date(sunCampaign.startDate).getDate() : "-"}
    </div>
  </div>

  {sunCampaign ? (
    <div className="settings-event">
      <div className="settings-pill">
        {sunCampaign.status}
      </div>

      <div className="settings-event-title">
        {sunCampaign.name}
      </div>

      <div className="settings-event-meta">
        <span>
          {sunCampaign.channels?.[0]?.toUpperCase() || "CHANNEL"}
        </span>
      </div>
    </div>
  ) : (
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
              <span className="settings-kpi-delta">+12% vs LW</span>
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
              <span className="settings-av settings-av-more">+120</span>
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
                <span>85% ACHIEVED</span>
              </div>
              <div className="settings-progress-bar">
                <div className="settings-progress-fill" />
              </div>
            </div>
          </div>
        </section>

<section className="settings-goals">
  {campaigns.length === 0 ? (
    <div>No Monthly Objective Found</div>
  ) : (
    <>
      <div className="settings-goals-top">
        <div>
          <div className="settings-section-title">
            Monthly Campaign Goals
          </div>
          <div className="settings-section-sub">
            Strategic objectives for October 2024
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
              {campaigns[0]?.goals?.targetReach ?? 0}
            </span>
            <span className="settings-goal-small">/ 3.0M goal</span>
          </div>

          <div className="settings-goal-bar">
            <div className="settings-goal-fill settings-goal-fill-blue" />
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
              {campaigns[0]?.goals?.targetCount ?? 0}
            </span>
            <span className="settings-goal-small">/ 500 goal</span>
          </div>

          <div className="settings-goal-bar">
            <div className="settings-goal-fill settings-goal-fill-slate" />
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
              {`${campaigns[0]?.goals?.targetEngagementRate ?? 0}%`}
            </span>
            <span className="settings-goal-small">/ 4.0% goal</span>
          </div>

          <div className="settings-goal-bar">
            <div className="settings-goal-fill settings-goal-fill-green" />
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
    DRAFTS ({filteredPosts.length})
  </div>

  {filteredPosts.map((post) => (
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
              {post.title}
            </div>

            <div className="settings-feed-sub">
              {post.description}
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

  {campaigns.map((campaign) => (
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
    src={campaign.image || "/assets/schedule.png"}
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

  {publishedPosts.map((post) => (
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
              {post.title}
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