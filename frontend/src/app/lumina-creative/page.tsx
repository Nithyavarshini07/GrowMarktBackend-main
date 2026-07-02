"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "../Dashboard/Dashboard.css";
import "./LuminaCreative.css";


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
const LuminaCreative = () => {
  const router = useRouter();

  return (
    <div className="dashboard lumina-page">
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
            <li>
              <img src="/assets/campaign.png" alt="campaign" className="nav-icon" />
              CAMPAIGN MANAGER
            </li>
            <li onClick={() => router.push("/analytics")}>
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

      <main className="main lumina-main">
        <header className="topbar">
          <div className="search-container">
            <span className="search-icon">
              <img src="/assets/search.png" alt="search" />
            </span>
            <input placeholder="Search competitors or metrics..." readOnly />
          </div>

          <div className="user-profile">
            <div className="user-profile-left">
              <div className="notif-icon">
                           <span className="search-icon">
              <IconSearch />
            </span>
                <span className="dot" />
              </div>
              <div className="profile-info">
                <p className="user-name">Alex Rivera</p>
                <p className="user-role">LEAD STRATEGIST</p>
              </div>
            </div>
            <img src="/assets/alex.jpg" alt="avatar" className="avatar" />
          </div>
        </header>
<button
  type="button"
  className="vm-back"
  onClick={() => {
    window.scrollTo(0, 0);
    router.push("/vortex-media");  // Make sure this matches exactly
  }}
>
  <span className="vm-back-arrow" aria-hidden="true">
    ←
  </span>
  Back to Main Vortex
</button>

        <section className="lumina-content-grid">
          <div className="lumina-left-column">
            <article className="lumina-post-card">
              <header className="lumina-post-head">
                <div className="lumina-author">
                  <img src="/assets/lumina2.png" alt="Lumina Creative" />
                  <div>
                    <h3>Lumina Creative</h3>
                    <p>Instagram • 2 days ago</p>
                  </div>
                </div>
                <button type="button" className="lumina-more-btn">•••</button>
              </header>

              <img src="/assets/lumina.jpg" alt="Featured post" className="lumina-feature-image" />

              <p className="lumina-caption">
                Exploring the boundaries between digital interfaces and organic movement. Our latest
                design study on "Fluidity" is now live on the blog. #DesignSystems #UI #UX #FutureDesign
              </p>
            </article>

            <article className="lumina-takeaway-card">
              <h4>💡 Strategic Takeaway</h4>
              <p>
                This post leveraged <strong>"Visual Novelty"</strong> to stop the scroll. The use of high-contrast
                iridescent textures against a minimalist UI backdrop resonated specifically with the 24-35 demographic.
              </p>
              <ul>
                <li>High-saturation imagery increases initial CTR by 14%</li>
                <li>Educational hashtags improved discoverability by 22%</li>
              </ul>
            </article>
          </div>

          <div className="lumina-right-column">
            <section className="lumina-metric-grid">
              <article className="lumina-stat-card">
                <p>REACH</p>
                <h4>124.5k</h4>
                <span className="stat-up">↗ +12%</span>
              </article>
              <article className="lumina-stat-card">
                <p>ENGAGEMENT RATE</p>
                <h4 className="stat-green">8.42%</h4>
                <span className="stat-green">↗ Above Avg</span>
              </article>
              <article className="lumina-stat-card">
                <p>SAVES</p>
                <h4>1,842</h4>
                <span>Top 5% Performance</span>
              </article>
              <article className="lumina-stat-card small">
                <p>LIKES</p>
                <h4>12.2k</h4>
                <i>♡</i>
              </article>
              <article className="lumina-stat-card small">
                <p>COMMENTS</p>
                <h4>482</h4>
                <i>◻</i>
              </article>
              <article className="lumina-stat-card small">
                <p>SHARES</p>
                <h4>956</h4>
                <i>⤴</i>
              </article>
            </section>

            <section className="lumina-velocity-card">
              <div className="velocity-head">
                <h4>Engagement Velocity</h4>
                <div className="velocity-legend">
                  <span><i className="this-post" /> THIS POST</span>
                  <span><i className="avg-post" /> AVG POST</span>
                </div>
              </div>
              <svg viewBox="0 0 680 210" className="velocity-chart" preserveAspectRatio="none">
                <line x1="0" y1="172" x2="680" y2="172" className="grid-line" />
                <line x1="0" y1="126" x2="680" y2="126" className="grid-line" />
                <line x1="0" y1="82" x2="680" y2="82" className="grid-line" />
                <path d="M0,182 C90,168 160,150 235,110 C290,76 335,42 415,40 C510,40 560,56 680,46" className="main-path" />
                <path d="M0,190 C85,185 150,170 230,154 C290,140 340,130 420,126 C500,124 560,132 680,128" className="avg-path" />
                <circle cx="235" cy="110" r="4" className="path-dot" />
                <circle cx="415" cy="40" r="4" className="path-dot" />
              </svg>
              <div className="velocity-axis">
                <span>HOUR 0</span>
                <span>HOUR 6</span>
                <span>HOUR 12</span>
                <span>HOUR 24</span>
                <span>HOUR 48</span>
              </div>
            </section>

            <section className="lumina-bottom-panels">
              <article className="lumina-sentiment-card">
                <h4>Audience Sentiment</h4>
                <div className="sentiment-row">
                  <div className="row-head"><span>POSITIVE</span><span>78%</span></div>
                  <div className="bar-shell"><div className="bar-fill positive" /></div>
                </div>
                <div className="sentiment-row">
                  <div className="row-head"><span>NEUTRAL</span><span>16%</span></div>
                  <div className="bar-shell"><div className="bar-fill neutral" /></div>
                </div>
                <div className="sentiment-row">
                  <div className="row-head"><span>NEGATIVE</span><span>6%</span></div>
                  <div className="bar-shell"><div className="bar-fill negative" /></div>
                </div>
              </article>

              <article className="lumina-context-card">
                <h4>Core Context</h4>
                <div className="context-tags">
                  <span>Innovation</span>
                  <span>Fluidity</span>
                  <span className="accent">Gamechanger</span>
                  <span>Modernist</span>
                  <span>Clean</span>
                  <span className="accent">Stunning</span>
                  <span>Technical</span>
                </div>
                <p className="association-label">KEY ASSOCIATION</p>
                <p className="association-text">High-End Technology &amp; Art</p>
              </article>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LuminaCreative;
