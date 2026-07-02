"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "../Dashboard/Dashboard.css";
import "./monthlyPerformance.css";

function NavIcon({ kind }) {
  if (kind === "dashboard") {
    return (
      <svg className="mp-nav-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M4 13.2c0-1.1 0-1.6.2-2 .2-.4.5-.7.9-.9.4-.2.9-.2 2-.2h1.6c1.1 0 1.6 0 2 .2.4.2.7.5.9.9.2.4.2.9.2 2V18H4v-4.8Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M14 6.8c0-1.1 0-1.6.2-2 .2-.4.5-.7.9-.9.4-.2.9-.2 2-.2h1.6c1.1 0 1.6 0 2 .2.4.2.7.5.9.9.2.4.2.9.2 2V18h-8V6.8Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M4 18h20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (kind === "campaign") {
    return (
      <svg className="mp-nav-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M6 9.5V7.8c0-.7.6-1.3 1.3-1.3h9.4c.7 0 1.3.6 1.3 1.3v1.7"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M6 18.2c0 .7.6 1.3 1.3 1.3h9.4c.7 0 1.3-.6 1.3-1.3V9.5c0-.7-.6-1.3-1.3-1.3H7.3C6.6 8.2 6 8.8 6 9.5v8.7Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M8.6 12.2l1.6 1.6 5-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (kind === "analytics") {
    return (
      <svg className="mp-nav-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M5 20V10c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M8 15l2-2 2 2 4-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (kind === "competitors") {
    return (
      <svg className="mp-nav-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M8 20V10.7c0-.9.7-1.7 1.7-1.7h4.6c.9 0 1.7.8 1.7 1.7V20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M6 20h12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M9.3 9.1c.7-2.1 2-3.3 2.7-3.3.7 0 2 1.2 2.7 3.3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  function IconSearch(props) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      aria-hidden="true" 
      width="18" 
      height="18"
      {...props}
    >
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
    <svg className="mp-nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2 4 5.2v6.4c0 5.2 3.3 9.7 8 10.4 4.7-.7 8-5.2 8-10.4V5.2L12 2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg className="mp-leaf" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 14c6-10 14-9 16-9-1 2-2 10-9 16-4 3-7 1-7-7Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 15c2 0 5-2 7-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function MonthlyPerformance() {
  const router = useRouter();

  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("http://localhost:3000/api/analytics")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);


  return (
    <div className="mp-page">
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
  <img
    src="/assets/campaign.png"
    alt="campaign"
    className="nav-icon"
  />
  CAMPAIGN MANAGER
</li>

    <li onClick={() => router.push("/analytics")} className="active">
      <img src="/assets/analytics.png" alt="analytics" className="nav-icon" />
      ANALYTICS
    </li>

<li onClick={() => router.push("/competitor-analysis")} style={{ cursor: "pointer" }}>
  <img src="/assets/competition.png" alt="competitors" className="nav-icon" />
  COMPETITORS
</li>

<li onClick={() => router.push("/settings")}>
  <img
    src="/assets/settings.png"
    alt="settings"
    className="nav-icon"
  />
  SETTINGS
</li>
          </ul>
        </nav>

        <button className="campaign-btn">+ NEW CAMPAIGN</button>
      </aside>

      <main className="mp-main">
<header className="topbar">
  <div className="search-container">
    <span className="search-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="10.5" cy="10.5" r="7.5"/>
        <line x1="16" y1="16" x2="22" y2="22"/>
      </svg>
    </span>
    <input placeholder="Search analytics..." />
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
</header>

        <section className="mp-body">
          <button
            type="button"
            className="mp-back"
            onClick={() => router.push("/analytics")}
          >
            <span className="mp-back-arrow" aria-hidden="true">
              ←
            </span>
            Back to Main Analytics
          </button>

          <div className="mp-head-row">
            <div className="mp-head-left">
              <h1 className="mp-title">
                Monthly Deep-Dive: October
                <br />
                2023
              </h1>
              <div className="mp-subtitle">
                A granular view of reach, engagement, and audience expansion throughout
                October.
              </div>
            </div>

            <div className="mp-growth">
              <div className="mp-growth-label">GROWTH MODE</div>
              <div className="mp-growth-pill">ACTIVE</div>
            </div>
          </div>

          <div className="mp-kpis">
            <article className="mp-kpi">
              <div className="mp-kpi-label">TOTAL MONTHLY REACH</div>
              <div className="mp-kpi-row">
                <div className="mp-kpi-value">
  {stats?.totalReach}
</div>
                <div className="mp-kpi-delta">
                  <span className="mp-kpi-plus">+</span>12.4%
                </div>
              </div>
            </article>

            <article className="mp-kpi">
              <div className="mp-kpi-label">AVG. ENGAGEMENT RATE</div>
              <div className="mp-kpi-row">
                <div className="mp-kpi-value">4.82%</div>
                <div className="mp-kpi-delta mp-kpi-delta--small">
                  <span className="mp-kpi-plus">+</span>0.6%
                </div>
              </div>
            </article>

            <article className="mp-kpi">
              <div className="mp-kpi-label">TOTAL NEW FOLLOWERS</div>
              <div className="mp-kpi-row">
                <div className="mp-kpi-value">+24,109</div>
                <div className="mp-kpi-delta mp-kpi-delta--right">
                  +15% prev
                  <br />
                  month
                </div>
              </div>
            </article>
          </div>

          <section className="mp-chart">
            <div className="mp-chart-head">
              <div className="mp-chart-title">Daily Growth Matrix</div>
              <div className="mp-chart-sub">
                Follower fluctuation relative to editorial output volume.
              </div>
              <div className="mp-chart-legend">
                <span className="mp-lg">
                  <span className="mp-lg-dot" aria-hidden="true" />
                  Growth
                </span>
                <span className="mp-lg mp-lg--muted">Proj. Baseline</span>
              </div>
            </div>

            <div className="mp-bars" aria-hidden="true">
              <div className="mp-bar mp-b1" />
              <div className="mp-bar mp-b2" />
              <div className="mp-bar mp-b3" />
              <div className="mp-bar mp-b4" />
              <div className="mp-bar mp-b5" />
              <div className="mp-bar mp-b6" />
              <div className="mp-bar mp-b7" />
              <div className="mp-bar mp-b8" />
              <div className="mp-bar mp-b9" />
              <div className="mp-bar mp-b10" />
              <div className="mp-bar mp-b11" />
              <div className="mp-bar mp-b12" />
              <div className="mp-bar mp-b13" />
              <div className="mp-bar mp-b14" />
              <div className="mp-bar mp-b15" />
            </div>

            <div className="mp-x" aria-hidden="true">
              <span>OCT 01</span>
              <span>OCT 08</span>
              <span>OCT 15</span>
              <span>OCT 22</span>
              <span>OCT 31</span>
            </div>
          </section>

          <div className="mp-split-head">
            <div className="mp-split-left">Platform Performance Breakdown</div>
            <div className="mp-split-right">Comparative Metrics</div>
          </div>

          <section className="mp-platforms">
            <article className="mp-plat">
              <div className="mp-plat-top">
                <div className="mp-plat-ico mp-ico-ig" aria-hidden="true" />
                <div className="mp-plat-delta mp-pos">+8.2%</div>
              </div>
              <div className="mp-plat-name">Instagram</div>
              <div className="mp-plat-divider" aria-hidden="true" />
              <div className="mp-plat-m">
                <span>Reach</span>
                <span>642k</span>
              </div>
              <div className="mp-plat-m">
                <span>Engagement</span>
                <span>5.2%</span>
              </div>
            </article>

            <article className="mp-plat">
              <div className="mp-plat-top">
                <div className="mp-plat-ico mp-ico-li" aria-hidden="true" />
                <div className="mp-plat-delta mp-pos">+14.5%</div>
              </div>
              <div className="mp-plat-name">LinkedIn</div>
              <div className="mp-plat-divider" aria-hidden="true" />
              <div className="mp-plat-m">
                <span>Reach</span>
                <span>210k</span>
              </div>
              <div className="mp-plat-m">
                <span>Engagement</span>
                <span>3.9%</span>
              </div>
            </article>

            <article className="mp-plat">
              <div className="mp-plat-top">
                <div className="mp-plat-ico mp-ico-x" aria-hidden="true" />
                <div className="mp-plat-delta mp-neg">-2.7%</div>
              </div>
              <div className="mp-plat-name">X (Twitter)</div>
              <div className="mp-plat-divider" aria-hidden="true" />
              <div className="mp-plat-m">
                <span>Reach</span>
                <span>380k</span>
              </div>
              <div className="mp-plat-m">
                <span>Engagement</span>
                <span>1.6%</span>
              </div>
            </article>

            <article className="mp-plat">
              <div className="mp-plat-top">
                <div className="mp-plat-ico mp-ico-tt" aria-hidden="true" />
                <div className="mp-plat-delta mp-pos">+28.3%</div>
              </div>
              <div className="mp-plat-name">TikTok</div>
              <div className="mp-plat-divider" aria-hidden="true" />
              <div className="mp-plat-m">
                <span>Reach</span>
                <span>116k</span>
              </div>
              <div className="mp-plat-m">
                <span>Engagement</span>
                <span>8.4%</span>
              </div>
            </article>
          </section>

          <div className="mp-nodes-head">
            <div className="mp-nodes-left">Impactful Nodes</div>
            <div className="mp-nodes-right">Top Performers of October</div>
          </div>

          <section className="mp-nodes">
            <article className="mp-node">
              <div className="mp-node-media mp-img-1">
                <div className="mp-node-date">OCT 13</div>
              </div>
              <div className="mp-node-body">
                <div className="mp-node-title">Mastering High-Growth Editorial Loops</div>
                <div className="mp-node-metrics">
                  <div className="mp-node-box">
                    <div className="mp-node-box-k">Reach</div>
                    <div className="mp-node-box-v">142k</div>
                  </div>
                  <div className="mp-node-box">
                    <div className="mp-node-box-k">Engagement</div>
                    <div className="mp-node-box-v">7.8%</div>
                  </div>
                </div>
              </div>
            </article>

            <article className="mp-node">
              <div className="mp-node-media mp-img-2">
                <div className="mp-node-date">OCT 19</div>
              </div>
              <div className="mp-node-body">
                <div className="mp-node-title">The Psychology of Viral B2B Narratives</div>
                <div className="mp-node-metrics">
                  <div className="mp-node-box">
                    <div className="mp-node-box-k">Reach</div>
                    <div className="mp-node-box-v">89k</div>
                  </div>
                  <div className="mp-node-box">
                    <div className="mp-node-box-k">Engagement</div>
                    <div className="mp-node-box-v">11.2%</div>
                  </div>
                </div>
              </div>
            </article>

            <article className="mp-node">
              <div className="mp-node-media mp-img-3">
                <div className="mp-node-date">OCT 24</div>
              </div>
              <div className="mp-node-body">
                <div className="mp-node-title">Predicting the Q4 Content Super-Cycle</div>
                <div className="mp-node-metrics">
                  <div className="mp-node-box">
                    <div className="mp-node-box-k">Reach</div>
                    <div className="mp-node-box-v">205k</div>
                  </div>
                  <div className="mp-node-box">
                    <div className="mp-node-box-k">Engagement</div>
                    <div className="mp-node-box-v">6.1%</div>
                  </div>
                </div>
              </div>
            </article>
          </section>
        </section>
      </main>
    </div>
  );
}