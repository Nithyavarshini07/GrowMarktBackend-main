"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "../Dashboard/Dashboard.css";
import "./PerformanceMetric.css";

const metricRows = [
  {
    icon: "👥",
    label: "Reach",
    you: "1.2M",
    youDelta: "+5%",
    rival: "940K",
    rivalDelta: "↓ 1%",
    variance: "+27.6% LEAD",
    varianceClass: "lead",
  },
  {
    icon: "⤴",
    label: "Engagement Rate",
    you: "4.82%",
    youDelta: "Stable",
    rival: "5.15%",
    rivalDelta: "↑ 0.4%",
    variance: "-6.4% LAG",
    varianceClass: "lag",
  },
  {
    icon: "↗",
    label: "Audience Growth",
    you: "24,502",
    youDelta: "↑ 14%",
    rival: "12,180",
    rivalDelta: "Stable",
    variance: "+101% LEAD",
    varianceClass: "lead",
  },
  {
    icon: "◔",
    label: "Share of Voice",
    you: "18.4%",
    youDelta: "↑ 2.1%",
    rival: "14.9%",
    rivalDelta: "↓ 0.8%",
    variance: "+3.5% LEAD",
    varianceClass: "lead",
  },
];

const PerformanceMetric = () => {
  const router = useRouter();

  return (
    <div className="dashboard performance-page">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand-header">
                  <span className="brand-main">GrowMarkt</span>
          <span className="brand-subtitle">THE DATA CURATOR</span>
  
        </div>

        <nav>
          <ul>
            <li onClick={() => router.back("/dashboard")} style={{ cursor: "pointer" }}>
              <img src="/assets/dashboard.png" alt="dashboard" className="nav-icon" />
              DASHBOARD
            </li>

            <li>
              <img src="/assets/campaign.png" alt="campaign" className="nav-icon" />
              CAMPAIGN MANAGER
            </li>

<li onClick={() => router.back("/analytics")} style={{ cursor: "pointer" }}>
  <img src="/assets/analytics.png" alt="analytics" className="nav-icon" />
  ANALYTICS
</li>

<li className="active">
  <img src="/assets/competition.png" alt="competitors" className="nav-icon" />
  COMPETITORS
</li>

            <li>
              <img src="/assets/settings.png" alt="settings" className="nav-icon" />
              SETTINGS
            </li>
          </ul>
        </nav>

        <button className="campaign-btn">+ NEW CAMPAIGN</button>
      </aside>

      

      {/* MAIN */}
      <main className="main performance-main">
        {/* TOPBAR */}
        <div className="topbar">

          <div className="search-container">
            <span className="search-icon">
              <img src="/assets/search.png" alt="search" />
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
                <p className="user-name">Alex Rivera</p>
                <p className="user-role">LEAD STRATEGIST</p>
              </div>

            </div>

            <img src="/assets/alex.jpg" alt="avatar" className="avatar" />

          </div>

        </div>
          <section className="pm-body">
    <button
      type="button"
      className="mp-back"
      onClick={() => router.back("/competitor-analysis")}
    >
      <span className="mp-back-arrow" aria-hidden="true">
        ←
      </span>
      Back to Main Competitors
    </button>
  </section>

        <section className="pm-top-cards">
          <article className="pm-score-card current">
            <p>CURRENT ENTITY</p>
            <div className="pm-score-row">
              <h3>GrowMarkt (You)</h3>
              <div>
                <strong>84.2</strong>
                <span>POWER SCORE</span>
              </div>
            </div>
            <small className="up">↗ +12% vs Last Month</small>
            <div className="pm-progress"><span style={{ width: "84%" }} /></div>
          </article>

          <article className="pm-score-card rival">
            <p>TARGET COMPETITOR</p>
            <div className="pm-score-row">
              <h3>Vortex Media</h3>
              <div>
                <strong>79.5</strong>
                <span>POWER SCORE</span>
              </div>
            </div>
            <small className="down">↘ -2.4% vs Last Month</small>
            <div className="pm-progress"><span style={{ width: "79%" }} /></div>
          </article>
        </section>

        <section className="pm-table-card">
          <div className="pm-table-head">
            <h3>Comparative Performance Metrics</h3>
            <div className="pm-tabs">
              <button>DAILY</button>
              <button className="active">MONTHLY</button>
              <button>QUARTERLY</button>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>METRIC CATEGORY</th>
                <th>GROWMARKT (YOU)</th>
                <th>VORTEX MEDIA</th>
                <th>MARKET VARIANCE</th>
              </tr>
            </thead>
            <tbody>
              {metricRows.map((row) => (
                <tr key={row.label}>
                  <td className="metric-col"><span>{row.icon}</span>{row.label}</td>
                  <td>{row.you} <em className="good">{row.youDelta}</em></td>
                  <td>{row.rival} <em className="bad">{row.rivalDelta}</em></td>
                  <td><b className={row.varianceClass}>{row.variance}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="pm-bottom-grid">
          <div className="pm-gap-card">
            <h3>Performance Gap Analysis</h3>

            <div className="gap-group">
              <div className="gap-head"><span>POST FREQUENCY (WEEKLY)</span><b>GAP: -4 POSTS/WK</b></div>
              <div className="gap-bar green"><span style={{ width: "70%" }}>GROWMARKT: 12</span></div>
              <div className="gap-bar navy"><span style={{ width: "100%" }}>VORTEX: 16</span></div>
            </div>

            <div className="gap-group">
              <div className="gap-head"><span>VIDEO IMPACT SCORE</span><b className="lead">LEAD: +18.2 %</b></div>
              <div className="gap-bar green"><span style={{ width: "100%" }}>GROWMARKT: 94.2</span></div>
              <div className="gap-bar navy"><span style={{ width: "80%" }}>VORTEX: 76.0</span></div>
            </div>

            <div className="gap-group">
              <div className="gap-head"><span>AUDIENCE SENTIMENT (NET)</span><b className="lead">LEAD: +12.5 %</b></div>
              <div className="gap-bar green"><span style={{ width: "92%" }}>GROWMARKT: 82%</span></div>
              <div className="gap-bar navy"><span style={{ width: "77%" }}>VORTEX: 68.5%</span></div>
            </div>
          </div>

          <div className="pm-side-cards">
            <article className="pm-note wins">
              <h4 className="pm-title">
  <img src="/assets/cup.png" alt="cup" className="pm-title-icon" />
  STRATEGIC WINS
</h4>
<p className="pm-point">
  <img src="/assets/tick.png" alt="tick" className="pm-tick-icon" />
  <span>
    <strong>Video Dominance</strong><br />
    Your video retention rates are 24% higher than Vortex's average.
  </span>
</p>
             <p className="pm-point">
  <img src="/assets/tick.png" alt="tick" className="pm-tick-icon" />
  <span>
    <strong>Comment Sentiment</strong><br />
    92% positive sentiment in replies vs 68% for the competitor.
  </span>
</p>
            </article>
            <article className="pm-note moves">
              <h4 className="pm-title">
  <img src="/assets/energy.png" alt="energy" className="pm-title-icon" />
  COUNTER-MOVES
</h4>
              <p className="pm-point">
  <img src="/assets/arrow.png" alt="arrow" className="pm-tick-icon" />
  <span>
    <strong>Increase Volume</strong><br />
    Increase LinkedIn post frequency by 30% to match Vortex's visibility.
  </span>
</p>

<p className="pm-point">
  <img src="/assets/arrow.png" alt="arrow" className="pm-tick-icon" />
  <span>
    <strong>Target Ad Segments</strong><br />
    Redirect spend to "Growth Capital" keywords where Vortex is currently weak.
  </span>
</p>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PerformanceMetric;
