"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "../Dashboard/Dashboard.css";
import "./VortexMedia.css";


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
const VortexMedia = () => {
  const router = useRouter();

  return (
    <div className="dashboard competitor-page">
      <aside className="sidebar competitor-sidebar">
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
            <li className="active" onClick={() => router.push("/competitor-analysis")}>
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

      <main className="main competitor-main">
        <header className="topbar competitor-topbar">
          <div className="search-container">
            <span className="search-icon">
              <img src="/assets/search.png" alt="search" />
            </span>
            <input placeholder="Search competitors or metrics..." readOnly />
          </div>

          <div className="user-profile">
            <div className="user-profile-left">
              <div className="notif-icon">
<IconSearch />
                <span className="dot" />
              </div>
              <div className="profile-info">
                <p className="user-name">Alex Mercer</p>
                <p className="user-role">PREMIUM CURATOR</p>
              </div>
            </div>
            <img src="/assets/alex.jpg" alt="avatar" className="avatar" />
          </div>
          
        </header>
        <section className="vm-body">
  <button
    type="button"
    className="vm-back"
    onClick={() => router.push("/competitor-analysis")}
  >
    <span className="vm-back-arrow" aria-hidden="true">
      ←
    </span>
    Back to Main Competitors
  </button>
</section>

        <section className="vortex-main-shell">
          <section className="vortex-header-card">
            <div className="vortex-header-left">
              <div className="vortex-logo">⚡</div>
              <div>
                <div className="vortex-name-row">
                  <h2>Vortex Media</h2>
                  <span>PRIMARY COMPETITOR</span>
                </div>
                <p>Digital First Marketing Agency - Market Challenger Status</p>
              </div>
            </div>
            <div className="vortex-header-actions">
              <button 
  type="button" 
  className="light-btn"
  onClick={() => router.push("/performance-metric")}
>
  COMPARE TO SELF
</button>
              <button type="button" className="dark-btn">GENERATE PDF REPORT</button>
            </div>
          </section>

          <section className="vortex-metric-grid">
            <article className="vortex-metric-card">
              <p>TOTAL REACH</p>
              <h3>
                1.2M <span className="metric-positive">+8.2%</span>
              </h3>
            </article>
            <article className="vortex-metric-card">
              <p>ENGAGEMENT RATE</p>
              <h3>
                4.8% <span className="metric-positive">+1.1%</span>
              </h3>
            </article>
            <article className="vortex-metric-card">
              <p>FOLLOWER GROWTH</p>
              <h3>
                +12.4% <span className="metric-positive">Above Avg</span>
              </h3>
            </article>
            <article className="vortex-metric-card">
              <p>SHARE OF VOICE</p>
              <h3>
                32.4% <span className="metric-negative">-2.4%</span>
              </h3>
            </article>
          </section>

          <section className="vortex-analytics-grid">
            <div className="vortex-growth-card">
              <div className="vortex-chart-head">
                <div>
                  <h4>Follower Growth Curve</h4>
                  <p>30-day competitive trajectory vs industry benchmark</p>
                </div>
                <div className="vortex-legend">
                  <span><i className="dot-brand" /> VORTEX MEDIA</span>
                  <span><i className="dot-industry" /> INDUSTRY AVG</span>
                </div>
              </div>

              <div className="vortex-chart-area">
                <svg viewBox="0 0 650 250" className="vortex-chart-svg" preserveAspectRatio="none">
                  <path
                    d="M20,210 L95,198 L150,160 L210,172 L280,105 L340,120 L405,82 L470,70 L530,44 L628,22"
                    className="brand-line"
                  />
                  <path
                    d="M20,185 L95,178 L150,172 L210,176 L280,160 L340,165 L405,156 L470,160 L530,148 L628,142"
                    className="benchmark-line"
                  />
                </svg>
                <div className="peak-card">
                  <p>PEAK VIRAL POINT</p>
                  <strong>+14,202</strong>
                  <span>New</span>
                </div>
              </div>
            </div>

            <div className="vortex-heatmap-card">
              <h4>Interaction Efficiency</h4>
              <p>Optimal audience engagement windows</p>
              <div className="vortex-heatmap-grid">
                {[1, 2, 3, 5, 6, 2, 3, 3, 2, 4, 6, 8, 4, 3, 2, 3, 5, 7, 6, 3, 2, 3, 4, 6, 5, 2, 1, 2, 2, 3, 4, 3, 1, 1, 1].map((level, idx) => (
                  <span key={idx} className={`hm l-${level}`} />
                ))}
              </div>
              <div className="vortex-heatmap-labels">
                <span>MON</span>
                <span>TUESDAY PEAK (11AM)</span>
                <span>SUN</span>
              </div>
            </div>
          </section>

          <section className="vortex-feed-section">
            <div className="vortex-feed-head">
              <h4>Trending Content Feed</h4>
              <div className="vortex-arrows">
                <span>‹</span>
                <span>›</span>
              </div>
            </div>

            <div className="vortex-feed-grid">
              <article className="vortex-feed-card">
                <div className="feed-image-wrap">
                  <img src="/assets/feed1.jpg" alt="feed one" />
                  <span className="feed-badge">HIGH VIRALITY</span>
                </div>
                <p className="feed-caption">"Why data storytelling is the future of digital marketing ...</p>
                <div className="feed-meta">
                  <span>♡ 12.4K</span>
                  <span>⤴ 1.2K</span>
                  <span className="meta-up">+22% VS AVG</span>
                </div>
<button 
  type="button" 
  onClick={() => {
    window.scrollTo(0, 0);
    router.push("/lumina-creative");
  }}
>
  ANALYZE POST
</button>
              </article>

              <article className="vortex-feed-card">
                <div className="feed-image-wrap">
                  <img src="/assets/feed2.jpg" alt="feed two" />
                </div>
                <p className="feed-caption">The culture behind the code: Meet the team driving...</p>
                <div className="feed-meta">
                  <span>♡ 8.1K</span>
                  <span>⤴ 452</span>
                  <span>-5% VS AVG</span>
                </div>
<button 
  type="button" 
  onClick={() => {
    window.scrollTo(0, 0);
    router.push("/lumina-creative");
  }}
>
  ANALYZE POST
</button>
              </article>

              <article className="vortex-feed-card">
                <div className="feed-image-wrap">
                  <img src="/assets/feed3.jpg" alt="feed three" />
                  <span className="feed-badge">TRENDING</span>
                </div>
                <p className="feed-caption">New Office Tour: Expanding our horizons with a new HQ i...</p>
                <div className="feed-meta">
                  <span>♡ 15.2K</span>
                  <span>⤴ 3.1K</span>
                  <span className="meta-up">+45% VS AVG</span>
                </div>
<button 
  type="button" 
  onClick={() => {
    window.scrollTo(0, 0);
    router.push("/lumina-creative");
  }}
>
  ANALYZE POST
</button>
              </article>

              <article className="vortex-feed-card">
                <div className="feed-image-wrap">
                  <img src="/assets/feed4.jpg" alt="feed four" />
                </div>
                <p className="feed-caption">Our Q3 Growth Report is out. Transparency is our...</p>
                <div className="feed-meta">
                  <span>♡ 9.4K</span>
                  <span>⤴ 890</span>
                  <span>+12% VS AVG</span>
                </div>
<button 
  type="button" 
  onClick={() => {
    window.scrollTo(0, 0);
    router.push("/lumina-creative");
  }}
>
  ANALYZE POST
</button>
              </article>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
};

export default VortexMedia;
