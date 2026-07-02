"use client";

import React from "react";
import { useRouter } from "next/navigation";
import "../Dashboard/Dashboard.css";
import "./TrendingCompetitorFeed.css";


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
const posts = [
  {
    image: "/assets/trending1.png",
    badge: (
  <>
    <img
      src="/assets/linked.png"
      alt="linkedin"
      className="badge-icon"
    />
    LINKEDIN
  </>
),
    title: "DataPulse Solutions",
    user: "1 hour ago",
    text: "We're excited to announce our latest breakthrough in neural network...",
    metricA: "8.2%",
    metricB: "42.1K",
    chip: "+12.4% HIGH GROWTH",
    chipClass: "green-chip",
  },
{
  image: "/assets/trending2.png",
  badge: (
    <>
      <img
        src="/assets/instagram.png"
        alt="instagram"
        className="badge-icon"
      />
      INSTAGRAM
    </>
  ),
  title: "CreativeSync Agency",
  user: "5 hours ago",
  text: "Culture is everything. Today we're celebrating 5 years of remote-first...",
  metricA: "15.4%",
  metricB: "1.2k",
  chip: "VIRAL VELOCITY",
},
  {
    image: "/assets/trending3.png",
    badge: "X / TWITTER",
    title: "Nexus Insights",
    user: "8 hours ago",
    text: "The shift towards privacy-first marketing isn't a trend, it's a...",
    metricA: "6.1%",
    metricB: "843",
   
  },
  {
    image: "/assets/trending4.png",
    badge: (
  <>
    <img
      src="/assets/tiktok.png"
      alt="tiktok"
      className="badge-icon"
    />
    TIKTOK
  </>
),
    title: "DataPulse Solutions",
    user: "1 day ago",
    text: "POV: You just integrated Axiom Growth and your morning coffee...",
    metricA: "22.8%",
    metricB: "185K",
  
  },
  {
    image: "/assets/trending5.png",
    badge: (
  <>
    <img
      src="/assets/linked.png"
      alt="linkedin"
      className="badge-icon"
    />
    LINKEDIN
  </>
),
    title: "Nexus Insights",
    user: "1 day ago",
    text: "How we scaled our API to handle 10 billion requests per month without a...",
    metricA: "6.7%",
    metricB: "12.5K",

  },
];

const TrendingCompetitorFeed = () => {
  const router = useRouter();
  

  return (
    <div className="dashboard trending-feed-page">
      {/* SIDEBAR */}
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

            <li>
              <img src="/assets/campaign.png" alt="campaign" className="nav-icon" />
              CAMPAIGN MANAGER
            </li>

<li onClick={() => router.push("/analytics")} style={{ cursor: "pointer" }}>
  <img src="/assets/analytics.png" alt="analytics" className="nav-icon" />
  ANALYTICS
</li>

<li className="active" onClick={() => router.push("/competitor-analysis")} style={{ cursor: "pointer" }}>
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

      {/* MAIN */}
      <main className="main">
        {/* TOPBAR */}
        <div className="topbar">

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
        <section className="tcf-back-body">
  <button
    type="button"
    className="tcf-back"
    onClick={() => router.push("/competitor-analysis")}
  >
    <span className="tcf-back-arrow" aria-hidden="true">
      ←
    </span>
    Back to Main Competitors
  </button>
</section>

        <section className="tcf-shell">
          <div className="tcf-header">
            <div>
              <h1>Trending Competitor Feed</h1>
              <p>
                Deep-dive into high-velocity industry content. Monitor engagement spikes
                <br />
                and viral patterns in real-time across your primary competitor landscape.
              </p>
            </div>
            <div className="tcf-live">
              <span>LIVE UPDATES</span>
              <b><i />12 new posts in the last hour</b>
            </div>
          </div>

          <div className="tcf-filter">
            <div className="tcf-search">
              <img src="/assets/search.png" alt="search" />
              <span>Search which competitor posts...</span>
            </div>
            <button>PLATFORM: ALL ▾</button>
            <button>TIME: LAST 7D ▾</button>
            <button>TYPE: VIRAL ▾</button>
            <button className="refresh">REFRESH FEED</button>
          </div>

          <div className="tcf-wrapper">

            <div className="tcf-grid">
              {posts.map((post, index) => (
  <article key={index} className="tcf-card">
                  <div className="media-wrap">
                    <img src={post.image} alt={post.title} />
                    <span className="badge">{post.badge}</span>
                    {post.chip ? (
  <span className={`chip ${post.chipClass || ""}`}>
    {post.chip}
  </span>
) : null}
                  </div>
                  <div className="card-body">
                    <h3 className="post-title">
                      <img src="/assets/iconimg.jpg" alt="source icon" className="title-icon" />
                      {post.title}
                    </h3>
                    <small>{post.user}</small>
                    <p>{post.text}</p>
                    <div className="metrics">
                      <div><label>ENGAGEMENT</label><strong>{post.metricA}</strong></div>
                      <div><label>TOTAL REACH</label><strong>{post.metricB}</strong></div>
                    </div>
                    <div className="card-foot">
                      <span>♡</span>
                      <span>◻</span>
                      <span>▻</span>
                      <button>ANALYZE POST</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <aside className="insight-panel">
              <span>Insight Summary</span>
              <small>AI-Powered Intelligence</small>
              <h4>Competitor activity is up 18% today.</h4>
              <p>
                Visual content is outperforming text-only posts by 2x across LinkedIn
                and X in your specific niche.
              </p>

              <div className="suggested-action-box">
    <p className="suggested-title">SUGGESTED ACTION</p>
    <p className="suggested-text">
      Post a technical video breakdown<br />
      to capitalize on the current trend.
    </p>
  </div>
              <button>GENERATE CONTENT BRIEF</button>
            </aside>

          </div>

          <div className="tcf-bottom">
            <button>LOAD MORE POSTS ↓</button>
            <p>SHOWING 12 OF 136 VIRAL POSTS FOUND</p>
          </div>

          <button className="floating-plus">+</button>
        </section>
      </main>
    </div>
  );
};

export default TrendingCompetitorFeed;
