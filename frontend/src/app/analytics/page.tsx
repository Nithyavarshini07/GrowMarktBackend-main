
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

import "./Analytics.css";


export default function AnalyticsPage() {
 const router = useRouter();

const { user, loading: authLoading } = useAuth();

useEffect(() => {
  if (!authLoading && !user) {
    router.push("/login");
  }
}, [user, authLoading, router]);

if (authLoading || !user) return null;

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
  return (
    <div className="analytics-page">
      {/* SIDEBAR */}
<aside className="sidebar">
  <div className="brand-header">
    <span className="brand-main">GrowMarkt</span>
    <span className="brand-subtitle">THE DATA CURATOR</span>
  </div>

  <nav>
    <ul>
      <li onClick={() => router.push("/dashboard")}>
        <img src="/assets/dashboard.png" alt="dashboard" className="nav-icon" />
        DASHBOARD
      </li>

      <li onClick={() => router.push("/campaign-timeline")}>
        <img src="/assets/campaign.png" alt="campaign" className="nav-icon" />
        CAMPAIGN MANAGER
      </li>

      <li className="active" onClick={() => router.push("/analytics")}>
        <img src="/assets/analytics.png" alt="analytics" className="nav-icon" />
        ANALYTICS
      </li>

      <li onClick={() => router.push("/competitor-analysis")} style={{ cursor: "pointer" }}>
        <img src="/assets/competition.png" alt="competitors" className="nav-icon" />
        COMPETITORS
      </li>

      <li onClick={() => router.push("/settings")}>
        <img src="/assets/settings.png" alt="settings" className="nav-icon" />
        SETTINGS
      </li>
    </ul>
  </nav>

  <button className="campaign-btn">+ NEW CAMPAIGN</button>
</aside>

      {/* MAIN */}
      <div className="analytics-main">
 {/* TOPBAR */}
<div className="analytics-topbar">
  <div className="search-container">
    <span className="search-icon">
      <IconSearch />
    </span>
    <input placeholder="Search insights..." />
  </div>

  <div className="user-profile">
    <div className="user-profile-left">
      <div className="notif-icon">
        <img src="/assets/bell.png" alt="notification" />
        <span className="dot"></span>
      </div>
      <div className="profile-info">
        <p className="user-name">Alex Mercer</p>
        <p className="user-role">PREMIUM CURATOR</p>
      </div>
    </div>
    <img src="/assets/alex.jpg" alt="avatar" className="avatar" />
  </div>
</div>

        {/* HEADER */}
        <div className="analytics-header">
          <div className="header-left">
            <h2>Growth Tracking</h2>
            <span className="header-divider" aria-hidden="true" />
          </div>
          <div className="header-right">
            <button className="add-btn">
              <span className="btn-plus" aria-hidden="true">+</span>
              <span>ADD METRIC</span>
            </button>
            <button className="date-filter">
              <span className="date-icon" aria-hidden="true" />
              <span>LAST 30 DAYS</span>
            </button>
            <div className="view-toggle">
  <button className="toggle-btn" onClick={() => router.push("/analytics-dense")}>Dense</button>
  <button className="toggle-btn active">Relaxed</button>
</div>
          </div>
        </div>

        {/* CARDS */}
        <div className="analytics-cards">
          {/* AGGREGATE */}
          <div className="card">
            <p className="metric-label">AGGREGATE REACH</p>
            <div className="metric-value-row">
              <h2>92,400</h2>
              <span className="green">↑ 14%</span>
            </div>
            <svg className="sparkline-small" viewBox="-5 0 110 40">
              <path d="M4,32 C16,30 26,30 35,24 C44,16 52,16 58,26 C64,34 72,35 80,17 C88,4 96,6 102,19" className="spark-green" fill="none"/>
            </svg>
          </div>

          {/* INSTAGRAM */}
          <div className="card">
            <p className="metric-label">
  <img src="/assets/instagram.png" className="card-icon" />
  INSTAGRAM
</p>
            <div className="metric-value-row">
              <h2>12.5k</h2>
              <span className="green">+2.4%</span>
            </div>
            <svg className="sparkline-small" viewBox="-5 0 110 40">
              <path d="M4,28 C14,24 22,22 31,25 C40,29 49,20 59,14 C69,10 79,15 89,12 C95,10 100,8 103,7" className="spark-pink" fill="none"/>
            </svg>
          </div>

          {/* LINKEDIN */}
          <div className="card">
            <p className="metric-label">
  <img src="/assets/linkedin2.png" className="card-icon" />
  LINKEDIN
</p>
            <div className="metric-value-row">
              <h2>4.2k</h2>
              <span className="green">+5.1%</span>
            </div>
            <svg className="sparkline-small" viewBox="-5 0 110 40">
             <path d="M4,30 C15,28 25,27 35,24 C45,21 54,18 64,15 C74,12 84,11 93,9 C98,8 101,7 103,7" className="spark-blue" fill="none"/>
            </svg>
          </div>

          {/* X */}
          <div className="card">
            <p className="metric-label">
  <img src="/assets/twitter.png" className="card-icon" />
  X (TWITTER)
</p>
            <div className="metric-value-row">
              <h2>28.9k</h2>
              <span className="red">-0.4%</span>
            </div>
            <svg className="sparkline-small" viewBox="-5 0 110 40">
              <path d="M4,12 C14,13 24,16 34,15 C44,14 53,17 63,19 C73,21 83,23 92,24 C98,25 101,26 103,27" className="spark-gray" fill="none"/>
            </svg>
          </div>
        </div>

        <div className="analytics-content">
          {/* GRAPH */}
          <div className="graph-box">
            <div className="graph-header">
  <div>
    <h3>HISTORICAL GROWTH VS ENGAGEMENT</h3>
    <p className="graph-sub">
      Aggregated cross-platform analytics for current period
    </p>
  </div>

  <div className="graph-icons">
    <span>↻</span>
    <span>⤢</span>
    <span>⋯</span>
  </div>
</div>
           <svg
  className="line-chart"
  viewBox="0 0 600 250"
>
 {/* grid */}
<line x1="40" y1="40" x2="560" y2="40" className="grid" />
<line x1="40" y1="90" x2="560" y2="90" className="grid" />
<line x1="40" y1="140" x2="560" y2="140" className="grid" />
<line x1="40" y1="190" x2="560" y2="190" className="grid" />

{/* green line */}
<path
  d="M40 165
     C90 150, 120 160, 170 150
     C220 120, 240 55, 290 85
     C340 125, 360 220, 410 165
     C455 110, 485 10, 520 55"
  className="line-green"
/>

{/* blue dashed line */}
<path
  d="M40 175
     C90 170, 120 155, 170 150
     C220 145, 250 145, 290 140
     C340 138, 380 145, 420 125
     C460 105, 490 85, 520 92"
  stroke="#3b82f6"
  strokeWidth="2.5"
  strokeDasharray="6 6"
  fill="none"
/>
</svg>
            <div className="graph-labels">
  <span>Sep 01</span>
  <span>Sep 10</span>
  <span>Sep 20</span>
  <span>Sep 30</span>
  <span>Oct 10</span>
  <span>Oct 20</span>
</div>
          </div>

          {/* SIDE PANEL */}
          {/* SIDE PANEL */}
<div className="side-box">
  <div className="side-box-header">
    <div className="title-with-icon">
      <img src="/assets/shield.png" className="shield-icon" />
      <h3>TOP PERFORMANCE NODES</h3>
    </div>

<button 
  className="view-all" 
  onClick={() => router.push("/PerformanceNodesLibrary")}
>
  VIEW ALL
</button>
  </div>

  <div className="node-list">
    {/* Node 1 */}
    <div className="node-item">
      <div className="node-thumb">
  <img src="/assets/topp1.jpg" alt="Organic Reach" />
</div>
      <div className="node-info">
        <strong>Organic Reach Surge</strong>
        <p>Instagram Reel • 12.3k Reach</p>
      </div>
      <div className="node-trend">
  <img src="/assets/trend-up.png" />
</div>
    </div>

    {/* Node 2 */}
    <div className="node-item">
      <div className="node-thumb">
  <img src="/assets/topp2.jpg" alt="Article" />
</div>
      <div className="node-info">
        <strong>Curator Ethos Article</strong>
        <p>LinkedIn Article • 8.4k Views</p>
      </div>
      <div className="node-trend">
  <img src="/assets/trend-up.png" />
</div>
    </div>
  </div>

  <div className="benchmark-section">
    <span className="benchmark-label">BENCHMARK STATUS</span>
    <div className="benchmark-tag">
      OUTPERFORMING (+8%)
    </div>
  </div>
</div>
        </div>

        {/* LOGS */}
        <div className="analytics-logs">
          <div className="logs-header">
            <div className="logs-title">
              <h3>MONTHLY PERFORMANCE LOG</h3>
              <p className="sub">Chronological analysis of growth events and revenue impact</p>
            </div>
            <div className="logs-actions">
              <button className="log-btn">💾 EXPORT DATA</button>
              <button className="log-btn">ALL PLATFORMS ▾</button>
              <button className="log-btn">MONTHLY VIEW ▾</button>
            </div>
          </div>

          {/* October Row */}
          <div className="log-row">
            <div className="log-col date">
              <strong>October 2023</strong>
              <p className="status-label">CURRENT PERIOD</p>
            </div>
            <div className="log-col growth">
              <span className="label">NET GROWTH</span>
              <span className="value positive">+2,451</span>
            </div>
            <div className="log-col revenue">
              <span className="label">CONVERSION & REVENUE</span>
              <span className="value">
                <strong>3.4%</strong> $12,490
              </span>
            </div>
            <div className="log-col spark">
              <svg viewBox="0 0 100 30" className="log-sparkline">
                <path d="M0,20 L20,15 L40,25 L60,10 L80,18 L100,5" fill="none" stroke="#10b981" strokeWidth="2" />
              </svg>
            </div>
            <div className="log-arrow">›</div>
          </div>

          {/* September Row */}
          <div className="log-row">
            <div className="log-col date">
              <strong>September 2023</strong>
              <p className="status-label">PREVIOUS MONTH</p>
            </div>
            <div className="log-col growth">
              <span className="label">NET GROWTH</span>
              <span className="value positive">+1,892</span>
            </div>
            <div className="log-col revenue">
              <span className="label">CONVERSION & REVENUE</span>
              <span className="value">
                <strong>2.9%</strong> $10,120
              </span>
            </div>
            <div className="log-col spark">
              <svg viewBox="0 0 100 30" className="log-sparkline">
                <path d="M0,22 L20,12 L40,18 L60,25 L80,10 L100,8" fill="none" stroke="#10b981" strokeWidth="2" />
              </svg>
            </div>
            <div className="log-arrow">›</div>
          </div>

          {/* August Row */}
          {/* August Row */}
<div className="log-row">
  <div className="log-col date">
    <strong>August 2023</strong>
    <p className="status-label">HISTORIC</p>
  </div>
  <div className="log-col growth">
    <span className="label">NET GROWTH</span>
    {/* 🔥 Changed from 'positive' to 'negative' to make it red */}
    <span className="value negative">+2,104</span> 
  </div>
  <div className="log-col revenue">
    <span className="label">CONVERSION & REVENUE</span>
    <span className="value">
      <strong>3.1%</strong> $11,350
    </span>
  </div>
  
  <div className="log-col spark">
    <svg viewBox="0 0 100 30" className="log-sparkline">
      <path d="M0,5 L20,8 L40,25 L60,18 L80,22 L100,28" fill="none" stroke="#ef4444" strokeWidth="2" />
    </svg>
  </div>
  <div className="log-arrow">›</div>
</div>

          <button className="load-more">LOAD MORE PERFORMANCE LOGS ▾</button>
        </div>
      </div>
    </div>
  );
};

