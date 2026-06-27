"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
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
  const [posts, setPosts] = useState([]);

  
useEffect(() => {
  if (!authLoading && !user) {
    router.push("/login");
  }
}, [user, authLoading, router]);

if (authLoading || !user) return null;

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
    placeholder="Search insights..."
  />
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
              <div className="settings-day-name">MON</div>
              <div className="settings-day-num">12</div>
            </div>
            <div className="settings-event settings-event-live">
              <div className="settings-pill settings-pill-live">LIVE</div>
              <div className="settings-event-title">Spring Collection Launch Video</div>
              <div className="settings-event-meta">
                <span className="settings-dot settings-dot-green" />
                                    <img
  src="/assets/instagram.png"
  alt="Instagram"
  className="settings-dot settings-dot-blue"
/>
                <span>INSTAGRAM</span>
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
              <div className="settings-day-num">13</div>
            </div>
            <div className="settings-event">
              <div className="settings-pill settings-pill-draft">DRAFT</div>
              <div className="settings-event-title">Weekly Metric Carousel Review</div>
              <div className="settings-event-meta">
                <span className="settings-dot settings-dot-blue" />
                <img
  src="/assets/linkedin3.png"
  alt="LinkedIn"
  className="settings-dot settings-dot-gray"
/>
                <span>LINKEDIN</span>
              </div>
            </div>
          </div>

          <div className="settings-day settings-day-active">
            <div className="settings-day-top">
              <div className="settings-day-name">WED</div>
              <div className="settings-day-num">14</div>
            </div>
            <div className="settings-event settings-event-dark">
              <div className="settings-pill settings-pill-plan">PLANNED</div>
              <div className="settings-event-title">Growth Catalyst Keynote Stream</div>
              <div className="settings-collab">
<div className="settings-faces">
  <img
    src="/assets/user1.jpg"
    alt="User 1"
    className="settings-face settings-face-1"
  />

  <img
    src="/assets/girl.jpg"
    alt="Girl"
    className="settings-face settings-face-2"
  />

  <img
    src="/assets/alex.jpg"
    alt="Alex"
    className="settings-face settings-face-3"
  />
</div>
                <div className="settings-collab-txt">Collaborators</div>
              </div>
            </div>
          </div>

          <div className="settings-day">
            <div className="settings-day-top">
              <div className="settings-day-name">THU</div>
              <div className="settings-day-num">15</div>
            </div>
            <div className="settings-empty">
              <div className="settings-empty-title">No events</div>
              <div className="settings-empty-sub">scheduled</div>
            </div>
          </div>

          <div className="settings-day">
            <div className="settings-day-top">
              <div className="settings-day-name">FRI</div>
              <div className="settings-day-num">16</div>
            </div>
            <div className="settings-event">
              <div className="settings-pill settings-pill-ready">READY</div>
              <div className="settings-event-title">Weekend Roundup Blast</div>
              <div className="settings-event-meta">
                <span className="settings-dot settings-dot-amber" />
                 <img
      src="/assets/contact.png"
      alt="Contact"
      className="settings-dot settings-dot-amber"
    />
                <span>EMAIL</span>
              </div>
            </div>
          </div>

          <div className="settings-day">
            <div className="settings-day-top">
              <div className="settings-day-name">SAT</div>
              <div className="settings-day-num">17</div>
            </div>
            <div className="settings-add">
              <div className="settings-add-btn">+</div>
            </div>
          </div>

          <div className="settings-day">
            <div className="settings-day-top">
              <div className="settings-day-name">SUN</div>
              <div className="settings-day-num">18</div>
            </div>
            <div className="settings-empty settings-empty-right">
              <div className="settings-empty-title">No events</div>
              <div className="settings-empty-sub">scheduled</div>
            </div>
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
              <span className="settings-kpi-big">142</span>
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
              <span className="settings-kpi-big">8.4k</span>
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
              <span className="settings-kpi-big">24</span>
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
          <div className="settings-goals-top">
            <div>
              <div className="settings-section-title">Monthly Campaign Goals</div>
              <div className="settings-section-sub">Strategic objectives for October 2024</div>
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
                <div className="settings-goal-state settings-state-ok">ON TRACK</div>
              </div>
              <div className="settings-goal-value">
                <span className="settings-goal-big">2.4M</span>
                <span className="settings-goal-small">/ 3.0M goal</span>
              </div>
              <div className="settings-goal-bar">
                <div className="settings-goal-fill settings-goal-fill-blue" />
              </div>
            </div>

            <div className="settings-goal">
              <div className="settings-goal-head">
                <div className="settings-goal-label">POST COUNT</div>
                <div className="settings-goal-state settings-state-risk">AT RISK</div>
              </div>
              <div className="settings-goal-value">
                <span className="settings-goal-big">312</span>
                <span className="settings-goal-small">/ 500 goal</span>
              </div>
              <div className="settings-goal-bar">
                <div className="settings-goal-fill settings-goal-fill-slate" />
              </div>
            </div>

            <div className="settings-goal">
              <div className="settings-goal-head">
                <div className="settings-goal-label">ENGAGEMENT RATE</div>
                <div className="settings-goal-state settings-state-good">EXCEEDING</div>
              </div>
              <div className="settings-goal-value">
                <span className="settings-goal-big">4.8%</span>
                <span className="settings-goal-small">/ 4.0% goal</span>
              </div>
              <div className="settings-goal-bar">
                <div className="settings-goal-fill settings-goal-fill-green" />
              </div>
            </div>
          </div>
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
  DRAFTS ({posts.filter(post => post.status === "draft").length})
</div>

              <div className="settings-feed-card settings-feed-card-draft">
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
                        Reimagining Urban Minimalism: A Visual Essay
                      </div>
                      <div className="settings-feed-sub">
                        Initial thoughts on how modular architectures influence digital UI...
                      </div>
                    </div>
                  </div>
                  <div className="settings-feed-tag settings-tag-draft">DRAFT</div>
                </div>
                <div className="settings-feed-foot">Edited 2h ago</div>
              </div>
            </div>

            <div className="settings-feed-col">
              <div className="settings-feed-colhead settings-feed-colhead-mid">SCHEDULED (6)</div>
              <div className="settings-feed-card settings-feed-card-scheduled">
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
                      <div className="settings-feed-title">Behind the Scenes: The Curator’s Process</div>
                    </div>
                  </div>
                  <div className="settings-feed-tag settings-tag-scheduled">SCHEDULED</div>
                </div>
                <img
  src="/assets/schedule.png"
  alt="Schedule"
  className="settings-feed-thumb"
/>
                <div className="settings-feed-foot settings-feed-foot-green">Tomorrow, 10:00 AM</div>
              </div>
            </div>

            <div className="settings-feed-col">
              <div className="settings-feed-colhead">PUBLISHED (142)</div>
              <div className="settings-feed-card settings-feed-card-pub">
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
                      <div className="settings-feed-title">10 Frameworks for Scaling Editorial Teams in 2024</div>
                    </div>
                  </div>
                  <div className="settings-feed-tag settings-tag-pub">PUBLISHED</div>
                </div>
                <div className="settings-feed-metrics">
                  <div className="settings-metric">
                    <div className="settings-metric-l">REACH</div>
                    <div className="settings-metric-v">12.4k</div>
                  </div>
                  <div className="settings-metric">
                    <div className="settings-metric-l">ENG</div>
                    <div className="settings-metric-v">4.2%</div>
                  </div>
                  <div className="settings-metric">
                    <div className="settings-metric-l">SHARES</div>
                    <div className="settings-metric-v">184</div>
                  </div>
                </div>
              </div>
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