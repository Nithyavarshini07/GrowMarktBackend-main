"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

import "./AnalyticsDense.css";
import { useRouter } from "next/navigation";

const AnalyticsDense = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

useEffect(() => {
    if (!authLoading && !user) {
        router.push("/login");
    }
}, [user, authLoading, router]);

if (authLoading || !user) {
    return null;
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

  return (
    <div className="ad-page">
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

      <main className="ad-main">
        <header className="ad-topbar">
          <div className="ad-search-container">
            <span className="ad-search-icon">
              <IconSearch />
            </span>
            <input placeholder="Search insights..." />
          </div>

          <div className="ad-user-profile">
            <div className="ad-user-profile-left">
              <div className="ad-notif-icon">
                <img src="/assets/bell.png" alt="notification" />
                <span className="ad-dot"></span>
              </div>
              <div className="ad-profile-info">
<p className="ad-user-name">
    {user?.name}
</p>

<p className="ad-user-role">
    {user?.role}
</p>
              </div>
            </div>
            <img src="/assets/alex.jpg" alt="avatar" className="ad-avatar" />
          </div>
        </header>

        <section className="ad-body">
          <div className="ad-head-row">
            <div className="ad-head-left">
              <span className="ad-crumb">
                WORKSPACE / GROWTH TRACKING
              </span>
              <span className="ad-header-divider" aria-hidden="true" />

              <button type="button" className="ad-add-btn">
                <span className="ad-btn-plus" aria-hidden="true">+</span>
                <span>ADD METRIC</span>
              </button>
            </div>

            <div className="ad-head-right">
              <button type="button" className="ad-range-btn">
                <span className="ad-date-icon" aria-hidden="true" />
                <span>LAST 30 DAYS</span>
              </button>

              <div className="ad-density-toggle">
                <button type="button" className="is-active">
                  DENSE
                </button>

<button 
  type="button" 
  onClick={() => router.push("/Analytics")}
>
  RELAXED
</button>
              </div>
            </div>
          </div>

          <div className="ad-metric-row">
            <article className="ad-card ad-card-aggregate">
              <div className="ad-card-title">
                <span>AGGREGATE REACH</span>
               
              </div>
<div className="ad-platform-top">
  <div>
    <span>AGGREGATE REACH</span>
  </div>
  <em>+14%</em>
</div>
<h2>92.4k</h2>
              <div className="ad-card-graph-wrap">
                <svg
                  viewBox="0 0 180 22"
                  className="ad-card-spark ad-green-line"
                >
                  <path d="M0 18 C15 15,28 16,40 16 C52 16,64 8,78 10 C92 12,102 24,116 20 C132 15,145 4,160 5 C170 6,176 12,180 16" />
                </svg>
              </div>
            </article>

            <article className="ad-card ad-card-platform">
              <div className="ad-platform-top">
                <div>
                  <img src="/assets/instagram.png" alt="" />
                  <span>INSTAGRAM</span>
                </div>

                <em>+2.4%</em>
              </div>

              <h2>12.5k</h2>

              <div className="ad-card-graph-wrap">
                <svg
                  viewBox="0 0 180 22"
                  className="ad-card-spark ad-pink-line"
                >
                  <path d="M0 14 C18 11,35 9,52 13 C70 17,88 20,108 12 C124 6,142 7,160 10 C170 12,176 9,180 6" />
                </svg>
              </div>
            </article>

            <article className="ad-card ad-card-platform">
              <div className="ad-platform-top">
                <div>
                  <img src="/assets/linkedin2.png" alt="" />
                  <span>LINKEDIN</span>
                </div>

                <em>+5.1%</em>
              </div>

              <h2>4.2k</h2>

              <div className="ad-card-graph-wrap">
                <svg
                  viewBox="0 0 180 22"
                  className="ad-card-spark ad-blue-line"
                >
                  <path d="M0 18 C18 18,36 17,58 15 C78 13,96 10,118 6 C138 4,158 3,180 3" />
                </svg>
              </div>
            </article>

            <article className="ad-card ad-card-platform">
              <div className="ad-platform-top">
                <div>
                  <img src="/assets/twitter.png" alt="" />
                  <span>X (TWITTER)</span>
                </div>

                <em className="is-red">-0.4%</em>
              </div>

              <h2>28.9k</h2>

              <div className="ad-card-graph-wrap">
                <svg
                  viewBox="0 0 180 22"
                  className="ad-card-spark ad-dark-line"
                >
                  <path d="M0 5 C22 8,44 9,66 11 C88 13,110 14,132 16 C150 18,166 20,180 20" />
                </svg>
              </div>
            </article>
          </div>

          <div className="ad-middle-row">
            <section className="ad-growth-box">
              <div className="ad-growth-head">
                <h3>HISTORICAL GROWTH VS ENGAGEMENT</h3>

                <div className="ad-growth-icons">
                  ↺ ⇩ ⛶
                </div>
              </div>

              <div className="ad-growth-chart-wrap">
                <svg
                  viewBox="0 0 640 230"
                  className="ad-growth-chart"
                >
                  <line x1="12" y1="190" x2="628" y2="190" />
                  <line x1="12" y1="150" x2="628" y2="150" />
                  <line x1="12" y1="110" x2="628" y2="110" />
                  <line x1="12" y1="70" x2="628" y2="70" />
                  <line x1="12" y1="30" x2="628" y2="30" />

                  <path
                    className="ad-growth-line-main"
                    d="M20 182 C 70 172, 120 176, 170 167 C 220 158, 258 100, 300 84 C 340 70, 392 116, 430 164 C 470 209, 520 176, 560 76 C 586 14, 612 32, 628 86"
                  />

                  <path
                    className="ad-growth-line-alt"
                    d="M20 187 C 88 178, 130 174, 170 168 C 212 160, 258 154, 300 153 C 338 152, 382 154, 420 156 C 462 160, 512 145, 552 130 C 582 118, 606 109, 628 97"
                  />

                  <text x="18" y="220">SEPT 01</text>
                  <text x="130" y="220">SEPT 10</text>
                  <text x="240" y="220">SEPT 20</text>
                  <text x="350" y="220">SEPT 30</text>
                  <text x="462" y="220">OCT 10</text>
                  <text x="572" y="220">OCT 20</text>
                </svg>
              </div>
            </section>

            <aside className="side-box"> 
  <div className="side-box-header"> 
    <div className="title-with-icon">  
      <img src="/assets/shield.png" alt="" />
      <h3>TOP PERFORMANCE NODES</h3> 
    </div>
    <button type="button" onClick={() => router.push("/PerformanceNodesLibrary")} className="view-all">
      VIEW ALL
    </button>
  </div>

  <div className="node-list">  
    <div className="node-item"> 
      <div className="node-thumb"> 
        <img src="/assets/topp1.jpg" alt="" />
      </div>
      <div className="node-info"> 
        <strong>Organic Reach Surge</strong>
        <p>IG Reel • 12.3k Reach</p>  
      </div>
      <div className="node-trend">  
        <img src="/assets/trend-up.png" alt="" />
      </div>
    </div>

    <div className="node-item">
      <div className="node-thumb">
        <img src="/assets/topp2.jpg" alt="" />
      </div>
      <div className="node-info">
        <strong>Curator Ethos Article</strong>
        <p>LI Article • 8.4k Views</p>
      </div>
      <div className="node-trend">
        <img src="/assets/trend-up.png" alt="" />
      </div>
    </div>
  </div>

  <div className="benchmark-section">  {/* Changed from ad-benchmark-row */}
    <span className="benchmark-label">BENCHMARK STATUS</span>  {/* Changed class */}
    <strong className="benchmark-tag">OUTPERFORMING (+8%)</strong>  {/* Changed class */}
  </div>
</aside>
          </div>

          <section className="ad-bottom-box">
            <div className="ad-bottom-head">
              <div className="ad-bottom-title">
                DATA EXPLORER: GROWTH TRENDS
              </div>

              <div className="ad-bottom-filters">
                <button type="button">
                  ALL PLATFORMS
                </button>

                <button type="button">
                  MONTHLY
                </button>
              </div>

              <div className="ad-bottom-actions">
                <button type="button">
                  EXPORT CSV
                </button>

                <button type="button">
                  EXPORT PDF
                </button>
              </div>
            </div>

            <div className="ad-table-row ad-table-head-row">
              <span>TIME PERIOD</span>
              <span>NET GROWTH</span>
              <span>CONV. RATE</span>
              <span>NET REVENUE</span>
              <span>DAILY TREND</span>
              <span>ACTIONS</span>
            </div>

            <div className="ad-table-row">
              <strong>October 2023</strong>
              <em className="is-green">+2,451</em>
              <span>3.4%</span>
              <strong>$12,490</strong>

              <svg
                viewBox="0 0 94 22"
                className="ad-daily-trend"
              >
                <path d="M2 15 L20 13 L34 18 L50 7 L67 10 L92 2" />
              </svg>

              <span className="ad-kebab">⋮</span>
            </div>

            <div className="ad-table-row">
              <strong>September 2023</strong>
              <em className="is-green">+1,892</em>
              <span>2.9%</span>
              <strong>$10,120</strong>

              <svg
                viewBox="0 0 94 22"
                className="ad-daily-trend"
              >
                <path d="M2 16 L20 8 L39 12 L55 15 L72 7 L92 5" />
              </svg>

              <span className="ad-kebab">⋮</span>
            </div>

            <div className="ad-table-row">
              <strong>August 2023</strong>
              <em className="is-red">+2,104</em>
              <span>3.1%</span>
              <strong>$11,350</strong>

              <svg
                viewBox="0 0 94 22"
                className="ad-daily-trend is-red"
              >
                <path d="M2 5 L20 7 L38 9 L55 16 L72 13 L92 19" />
              </svg>

              <span className="ad-kebab">⋮</span>
            </div>

            <div className="ad-bottom-foot">
              <span>
                DISPLAYING 1-12 OF 48 RECORDS
              </span>

              <div>
                <span>‹</span>
                <span>›</span>
              </div>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
};

export default AnalyticsDense;