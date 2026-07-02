
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import "../Dashboard/Dashboard.css";
import "./postImpact.css";

function NavIcon({ kind }) {
  if (kind === "dashboard") {
    return (
      <svg className="pi-nav-icon" viewBox="0 0 24 24" aria-hidden="true">
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
      <svg className="pi-nav-icon" viewBox="0 0 24 24" aria-hidden="true">
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
      <svg className="pi-nav-icon" viewBox="0 0 24 24" aria-hidden="true">
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
      <svg className="pi-nav-icon" viewBox="0 0 24 24" aria-hidden="true">
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

  return (
    <svg className="pi-nav-icon" viewBox="0 0 24 24" aria-hidden="true">
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
    <svg className="pi-leaf" viewBox="0 0 24 24" aria-hidden="true">
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

export default function PostImpact() {
  const router = useRouter();
useEffect(() => {
  window.scrollTo(0, 0);
}, []);
  

  return (
    <div className="pi-page">
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

      <main className="pi-main">
<header className="pi-topbar">
  <div className="pi-search">
    <svg className="pi-search-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10.5 18.5a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M16.9 16.9 21 21"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
    <input value="Search data..." readOnly />
  </div>

  <div className="pi-user-area">
    <div className="pi-user-text">
      <div className="pi-user-name-row">
        <div className="pi-notif-icon">
          <img src="/assets/bell.png" alt="notification" />
          <span className="pi-dot"></span>
        </div>
        <span className="pi-user-name">Alex Mercer</span>
      </div>
      <div className="pi-user-tier">PREMIUM CURATOR</div>
    </div>
    <img src="/assets/alex.jpg" alt="avatar" className="pi-avatar" />
  </div>
</header>

        <section className="pi-body">

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
          <section className="pi-post-card">
            <div className="pi-post-top">
              <div className="pi-post-badge">
                <span className="pi-badge-icon" aria-hidden="true">
                  ↘
                </span>
                <span className="pi-badge-text">LINKEDIN PUBLICATION</span>
              </div>
              <div className="pi-post-meta">PUBLISHED OCT 24, 2023</div>
            </div>

            <div className="pi-post-grid">
              <div className="pi-post-left">
                <h1 className="pi-post-title">
                  “The era of high-interest rates isn’t just a financial shift; it’s a structural reset of how we value growth over profitability.”
                </h1>
                <p className="pi-post-sub">
                  Detailed analysis of why startups must pivot from ‘growth-at-all-costs’ to ‘sustainable unit economics’ in the 2024 landscape. Included a 12-page PDF whitepaper.
                </p>
              </div>

              <div className="pi-post-actions">
                <button type="button" className="pi-action-btn">
                  EDIT POST
                </button>
                <button type="button" className="pi-action-btn pi-action-btn--ghost">
                  VIEW ORIGINAL
                </button>
              </div>
            </div>
          </section>

          <section className="pi-metrics-row">
            <article className="pi-metric">
              <div className="pi-metric-top">
                <span className="pi-metric-icon pi-i-eye" aria-hidden="true" />
                <span className="pi-metric-delta">+12.4%</span>
              </div>
              <div className="pi-metric-label">TOTAL REACH</div>
              <div className="pi-metric-value">142,890</div>
            </article>

            <article className="pi-metric">
              <div className="pi-metric-top">
                <span className="pi-metric-icon pi-i-bolt" aria-hidden="true" />
                <span className="pi-metric-delta">+4.7%</span>
              </div>
              <div className="pi-metric-label">ENGAGEMENT RATE</div>
              <div className="pi-metric-value">5.82%</div>
            </article>

            <article className="pi-metric">
              <div className="pi-metric-top">
                <span className="pi-metric-icon pi-i-click" aria-hidden="true" />
                <span className="pi-metric-delta">+21.8%</span>
              </div>
              <div className="pi-metric-label">TOTAL CLICKS</div>
              <div className="pi-metric-value">8,412</div>
            </article>

            <article className="pi-metric">
              <div className="pi-metric-top">
                <span className="pi-metric-icon pi-i-share" aria-hidden="true" />
                <span className="pi-metric-delta">+9.3%</span>
              </div>
              <div className="pi-metric-label">SHARES</div>
              <div className="pi-metric-value">1,204</div>
            </article>

            <article className="pi-metric pi-metric--neg">
              <div className="pi-metric-top">
                <span className="pi-metric-icon pi-i-down" aria-hidden="true" />
                <span className="pi-metric-delta pi-metric-delta--neg">-1.7%</span>
              </div>
              <div className="pi-metric-label">DROP-OFF</div>
              <div className="pi-metric-value">—</div>
            </article>
          </section>

          <section className="pi-grid-2">
            <article className="pi-panel pi-panel--chart">
              <div className="pi-panel-head">
                <div className="pi-panel-title">
                  <div className="pi-panel-h">Performance Over Time</div>
                  <div className="pi-panel-sub">FIRST 72 HOURS VIRAL VELOCITY</div>
                </div>

                <div className="pi-panel-tabs" aria-label="Metric toggle">
                  <button type="button" className="pi-tab">
                    REACH
                  </button>
                  <button type="button" className="pi-tab pi-tab--active">
                    ENGAGEMENT
                  </button>
                </div>
              </div>

              <div className="pi-bars">
                <div className="pi-bar pi-bar--l1" />
                <div className="pi-bar pi-bar--l2" />
                <div className="pi-bar pi-bar--g1" />
                <div className="pi-bar pi-bar--g2" />
                <div className="pi-bar pi-bar--g3" />
                <div className="pi-bar pi-bar--g4" />
                <div className="pi-bar pi-bar--g5" />
                <div className="pi-bar pi-bar--g6" />
              </div>

              <div className="pi-xlabels">
                <span>HOUR 0</span>
                <span>HOUR 12</span>
                <span>HOUR 24</span>
                <span>HOUR 36</span>
                <span>HOUR 48</span>
                <span>HOUR 60</span>
                <span>HOUR 72</span>
              </div>
            </article>

            <article className="pi-panel pi-panel--side">
              <div className="pi-panel-head pi-panel-head--tight">
                <div className="pi-panel-title">
                  <div className="pi-panel-h">Cross-Platform</div>
                  <div className="pi-panel-sub">PERFORMANCE DISTRIBUTION</div>
                </div>
              </div>

              <div className="pi-dist">
                <div className="pi-dist-row">
                  <div className="pi-dist-left">
                    <span className="pi-dist-name">LinkedIn</span>
                  </div>
                  <div className="pi-dist-right">
                    <div className="pi-dist-track">
                      <div className="pi-dist-fill pi-dist-fill--li" />
                    </div>
                    <span className="pi-dist-pct">65%</span>
                    <span className="pi-dist-foot">Total impact</span>
                  </div>
                </div>

                <div className="pi-dist-row">
                  <div className="pi-dist-left">
                    <span className="pi-dist-name">Twitter / X</span>
                  </div>
                  <div className="pi-dist-right">
                    <div className="pi-dist-track">
                      <div className="pi-dist-fill pi-dist-fill--x" />
                    </div>
                    <span className="pi-dist-pct">26%</span>
                    <span className="pi-dist-foot">Total impact</span>
                  </div>
                </div>

                <div className="pi-dist-row">
                  <div className="pi-dist-left">
                    <span className="pi-dist-name">Substack</span>
                  </div>
                  <div className="pi-dist-right">
                    <div className="pi-dist-track">
                      <div className="pi-dist-fill pi-dist-fill--ss" />
                    </div>
                    <span className="pi-dist-pct">7%</span>
                    <span className="pi-dist-foot">Total impact</span>
                  </div>
                </div>
              </div>

              <div className="pi-strategy">
                <div className="pi-strategy-badge">WARNING STRATEGY</div>
                <div className="pi-strategy-box">
                  <div className="pi-strategy-ico" aria-hidden="true" />
                  <div className="pi-strategy-copy">
                    <strong>VIRAL POST</strong>
                    <span>3.4x more shares on LinkedIn than plan avg.</span>
                  </div>
                </div>
              </div>
            </article>
          </section>

          <section className="pi-grid-2b">
            <article className="pi-panel pi-panel--heat">
              <div className="pi-panel-head pi-panel-head--tight">
                <div className="pi-panel-title">
                  <div className="pi-panel-h">Engagement Heatmap</div>
                  <div className="pi-panel-sub">GLOBAL INTERACTION DENSITY</div>
                </div>
              </div>

              <div className="pi-heat">
                <div className="pi-heat-left">
                  <div className="pi-heat-day">MON</div>
                  <div className="pi-heat-day">TUE</div>
                  <div className="pi-heat-day">WED</div>
                  <div className="pi-heat-day">THU</div>
                  <div className="pi-heat-day">FRI</div>
                  <div className="pi-heat-day">SAT</div>
                  <div className="pi-heat-day">SUN</div>
                </div>
                <div className="pi-heat-grid" aria-hidden="true" />
              </div>

              <div className="pi-heat-x">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
              </div>
            </article>

            <article className="pi-panel pi-panel--sent">
              <div className="pi-sent-head">
                <div className="pi-sent-title">
                  <div className="pi-panel-h">Sentiment Analysis</div>
                  <div className="pi-panel-sub">NATURAL LANGUAGE TONE</div>
                </div>

                <div className="pi-sent-pill">
                  <span className="pi-sent-dot" aria-hidden="true" />
                  HIGHLY POSITIVE
                </div>
              </div>

              <div className="pi-sent-body">
                <div className="pi-ring">
                  <svg viewBox="0 0 120 120" className="pi-ring-svg" aria-hidden="true">
                    <circle cx="60" cy="60" r="44" className="pi-ring-track" />
                    <circle cx="60" cy="60" r="44" className="pi-ring-fill" />
                  </svg>
                  <div className="pi-ring-center">
                    <div className="pi-ring-pct">82%</div>
                    <div className="pi-ring-sub">POSITIVE</div>
                  </div>
                </div>

                <div className="pi-sent-list">
                  <div className="pi-sent-item">
                    <span className="pi-sent-bullet pi-b1" />
                    <span className="pi-sent-name">Thought-Provoking</span>
                    <span className="pi-sent-val">62%</span>
                  </div>
                  <div className="pi-sent-item">
                    <span className="pi-sent-bullet pi-b2" />
                    <span className="pi-sent-name">Constructive Criticis.</span>
                    <span className="pi-sent-val">24%</span>
                  </div>
                  <div className="pi-sent-item">
                    <span className="pi-sent-bullet pi-b3" />
                    <span className="pi-sent-name">Spam / Neutral</span>
                    <span className="pi-sent-val">4%</span>
                  </div>
                </div>
              </div>

              <div className="pi-key-phrase">
                <div className="pi-key-ico" aria-hidden="true" />
                <div className="pi-key-copy">
                  <div className="pi-key-k">Key Phrase: “Structural Reset”</div>
                  <div className="pi-key-sub">
                    This is the clearest indicator of the audience ‘lending climate’ if we read this post.
                  </div>
                </div>
              </div>
            </article>
          </section>

          <section className="pi-panel pi-panel--action">
            <div className="pi-action-head">
              <div className="pi-panel-title">
                <div className="pi-panel-h">Actionable Engagement</div>
                <div className="pi-panel-sub">WHAT TO DO NEXT: USER BEHAVIORS</div>
              </div>
              <button
                type="button"
                className="pi-export"
                onClick={() => router.push("/monthly-performance")}
              >
                EXPORT DETAILED REPORT
              </button>
            </div>

            <div className="pi-action-row">
              <div className="pi-action-card">
                <div className="pi-action-top">
                  <span className="pi-ac-ico pi-ac-1" aria-hidden="true" />
                  <span className="pi-ac-num">2,410</span>
                </div>
                <div className="pi-ac-label">PROFILE CLICKS</div>
                <div className="pi-ac-sub">
                  Converting visitors into positive &amp; repeat advocates in 72h, which is 30% above benchmark.
                </div>
              </div>

              <div className="pi-action-card">
                <div className="pi-action-top">
                  <span className="pi-ac-ico pi-ac-2" aria-hidden="true" />
                  <span className="pi-ac-num">+412</span>
                </div>
                <div className="pi-ac-label">NEW FOLLOWERS</div>
                <div className="pi-ac-sub">
                  Profile views spiked significantly in the first 48 hours after the second paragraph reveal.
                </div>
              </div>

              <div className="pi-action-card">
                <div className="pi-action-top">
                  <span className="pi-ac-ico pi-ac-3" aria-hidden="true" />
                  <span className="pi-ac-num">894</span>
                </div>
                <div className="pi-ac-label">BOOKMARKS</div>
                <div className="pi-ac-sub">
                  High bookmarking rate indicates “evergreen” value. This content should be recycled in 3 months.
                </div>
              </div>
            </div>
          </section>

          <div className="pi-footer">
            DATA CURATOR ENGINE v3.2.0 • GENERATED AT 14:32:01 UTC
          </div>
        </section>
      </main>
    </div>
  );
}