"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import "../Dashboard/Dashboard.css";
import "../settings/settings.css";
import "./help.css";

import { api } from "@/lib/api";


function IconDashboard(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 13.5V6.8A2.8 2.8 0 0 1 6.8 4h3.9A2.8 2.8 0 0 1 13.5 6.8v3.9A2.8 2.8 0 0 1 10.7 13.5H4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 20H6.8A2.8 2.8 0 0 1 4 17.2v-1.7h6.5V20Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M14.8 20H17.2A2.8 2.8 0 0 0 20 17.2v-3.9A2.8 2.8 0 0 0 17.2 10.5h-2.4A2.8 2.8 0 0 0 12 13.3v3.9A2.8 2.8 0 0 0 14.8 20Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M14 4h3.2A2.8 2.8 0 0 1 20 6.8v1.9h-6V6.8A2.8 2.8 0 0 1 16.8 4H14Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCampaign(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 8.5h16v9.2A2.3 2.3 0 0 1 17.7 20H6.3A2.3 2.3 0 0 1 4 17.7V8.5Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path
        d="M7 8.5V6.7A2.7 2.7 0 0 1 9.7 4h4.6A2.7 2.7 0 0 1 17 6.7v1.8"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path d="M4 12.2h16" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function IconAnalytics(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M4 20V4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M6.5 18h13.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M8 16V12" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M12 16V8" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M16 16V10" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M20 16V6" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}

function IconCompetitors(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M16 11a4 4 0 1 0-8 0" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path
        d="M4 20v-1.2A4.8 4.8 0 0 1 8.8 14h6.4A4.8 4.8 0 0 1 20 18.8V20"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path d="M20 9.8a3.2 3.2 0 0 0-2.1-3" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function IconSettings(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 15.7a3.7 3.7 0 1 0 0-7.4 3.7 3.7 0 0 0 0 7.4Z" stroke="currentColor" strokeWidth="1.9" />
      <path
        d="M19.4 12a7.56 7.56 0 0 0-.1-1l2-1.6-1.9-3.3-2.5 1a7.8 7.8 0 0 0-1.7-1L15 3h-6l-.2 2.1a7.8 7.8 0 0 0-1.7 1l-2.5-1L2.7 8.4l2 1.6a7.56 7.56 0 0 0 0 2l-2 1.6 1.9 3.3 2.5-1a7.8 7.8 0 0 0 1.7 1L9 21h6l.2-2.1a7.8 7.8 0 0 0 1.7-1l2.5 1 1.9-3.3-2-1.6c.1-.3.1-.7.1-1Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSearch(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M10.8 18.2a7.4 7.4 0 1 0 0-14.8 7.4 7.4 0 0 0 0 14.8Z" stroke="currentColor" strokeWidth="2" />
      <path d="M20.4 20.4l-3.9-3.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconBell(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path d="M14 19a2 2 0 1 1-4 0" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function IconCalendar(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M7 4v3M17 4v3M4.5 9.2h15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6.7 6.2h10.6A2.7 2.7 0 0 1 20 8.9v10.1A2.7 2.7 0 0 1 17.3 21H6.7A2.7 2.7 0 0 1 4 19V8.9a2.7 2.7 0 0 1 2.7-2.7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M8.1 12.6h3.2M8.1 16h6.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconMail(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 7.2A2.2 2.2 0 0 1 6.2 5h11.6A2.2 2.2 0 0 1 20 7.2v9.6A2.2 2.2 0 0 1 17.8 19H6.2A2.2 2.2 0 0 1 4 16.8V7.2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M5.4 7.7 12 12.6l6.6-4.9" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export default function Help() {
  
    

    const router = useRouter();

const [profile, setProfile] = useState({
  name: "",
  role: "",
  avatar: ""
});

const [notificationCount, setNotificationCount] = useState(0);

const [systemStatus, setSystemStatus] = useState("Operational");


useEffect(() => {
  loadHelpData();
}, []);

async function loadHelpData() {
  try {
    const data = await api.help.get();

    setProfile({
      name: data.user.name,
      role: data.user.role,
      avatar: data.user.avatar
    });

    setNotificationCount(data.notifications);

    setSystemStatus(data.systemStatus);
  } catch (err) {
    console.error(err);
  }
}


async function scheduleCall() {
  try {
    await api.help.scheduleCall();
    alert("Consultation scheduled.");
  } catch (err) {
    console.error(err);
  }
}

async function contactSupport() {
  try {
    await api.help.contactSupport();
    alert("Support request sent.");
  } catch (err) {
    console.error(err);
  }
}


  return (
    <div className="settings-page">
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

            <li onClick={() => router.push("/analytics")}>
              <img src="/assets/analytics.png" alt="analytics" className="nav-icon" />
              ANALYTICS
            </li>

            <li onClick={() => router.push("/competitor-analysis")} style={{ cursor: "pointer" }}>
              <img src="/assets/competition.png" alt="competitors" className="nav-icon" />
              COMPETITORS
            </li>

            <li className="active">
              <img src="/assets/settings.png" alt="settings" className="nav-icon" />
              SETTINGS
            </li>
          </ul>
        </nav>

        <button className="campaign-btn">+ NEW CAMPAIGN</button>
      </aside>

      <main className="settings-main">
        <header className="settings-topbar">
          <div className="settings-search">
            <span className="settings-search-icon" aria-hidden="true">
              <IconSearch />
            </span>
            <input placeholder="Search data..." />
          </div>

          <div className="user-profile">
            <div className="user-profile-left">
              <div className="notif-icon">
                <img src="/assets/bell.png" alt="notification" />
                {notificationCount > 0 && (
    <span className="dot"></span>
)}
              </div>

              <div className="profile-info">
                <p className="user-name">{profile.name}</p>
                <p className="user-role">{profile.role}</p>
              </div>
            </div>

            <img
    src={profile.avatar || "/assets/alex.jpg"}
    alt="avatar"
    className="avatar"
/>
          </div>
        </header>

        <section className="settings-header">
          <h1>Support &amp; Help</h1>
          <p>Get the expert assistance you need to scale your market presence.</p>
        </section>

        <section className="settings-tabs" role="tablist" aria-label="Settings sections">
          <button type="button" onClick={() => router.push("/settings")}>
            ACCOUNT &amp; TEAM
          </button>
          <button type="button" onClick={() => router.push("/billing")}>
            BILLING &amp; PAYMENT
          </button>
          <button type="button" className="active">
            SUPPORT &amp; HELP
          </button>
          <button type="button" onClick={() => router.push("/notifications")}>
            NOTIFICATIONS
          </button>
        </section>

        <section className="help-body">
          <div className="help-cards">
            <div className="help-card help-card-dark">
              <div className="help-card-dark-inner">
                <div className="help-kicker">WHITE GLOVE SUPPORT</div>
                <div className="help-title">Schedule a Strategic Consultation</div>
                <div className="help-sub">
                  Connect with our senior Meta strategists to review your performance metrics and optimize your content
                  strategy for €4.
                </div>
                <button
    type="button"
    className="help-primary-btn"
    onClick={scheduleCall}
>
                  <span className="help-primary-ic" aria-hidden="true">
                    <img src="/assets/sche.png" alt="Schedule" className="icon-calendar" />
                  </span>
                  SCHEDULE STRATEGIC CALL
                </button>
              </div>
            </div>

            <div className="help-card help-card-light">
              <div className="help-card-light-inner">
                <div className="help-kicker help-kicker-muted">DIRECT ASSISTANCE</div>
                <div className="help-title-light">Email Technical Support</div>
                <div className="help-sub-light">
                  Running into integration issues or need help with custom reporting? Our engineering team is available
                  24/7 for technical queries.
                </div>
               <button
    type="button"
    className="help-secondary-btn"
    onClick={contactSupport}
>
                  <span className="help-secondary-ic" aria-hidden="true">
                    <img src="/assets/contact.png" alt="Contact" className="icon-mail" />
                  </span>
                  CONTACT SUPPORT TEAM
                </button>
                <div className="help-response">
                  TYPICAL RESPONSE TIME: <span className="help-response-val">24 MINS</span>
                </div>
              </div>
            </div>
          </div>

          <div className="help-status">
            <span className="help-status-dot" aria-hidden="true" />
            ALL GROWMARKT SYSTEMS {systemStatus.toUpperCase()}
          </div>
        </section>
      </main>
    </div>
  );
}