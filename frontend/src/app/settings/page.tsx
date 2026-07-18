"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

import "../dashboard/Dashboard.css";
import "../settings/settings.css";




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
      <path
        d="M4 12.2h16"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconAnalytics(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 20V4"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M6.5 18h13.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M8 16V12"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path
        d="M12 16V8"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path
        d="M16 16V10"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path
        d="M20 16V6"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconCompetitors(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M16 11a4 4 0 1 0-8 0"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M4 20v-1.2A4.8 4.8 0 0 1 8.8 14h6.4A4.8 4.8 0 0 1 20 18.8V20"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M20 9.8a3.2 3.2 0 0 0-2.1-3"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconSettings(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 15.7a3.7 3.7 0 1 0 0-7.4 3.7 3.7 0 0 0 0 7.4Z"
        stroke="currentColor"
        strokeWidth="1.9"
      />
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

function IconBell(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path
        d="M14 19a2 2 0 1 1-4 0"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}
export default function Settings() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("account");
  const [settingsData, setSettingsData] = useState<any>(null);
  useEffect(() => {
  async function loadSettings() {
    try {
      const data = await api.settings.get();

      console.log(data);

      setSettingsData(data);
    } catch (error) {
      console.error(error);
    }
  }

  loadSettings();
}, []);

  const [profile, setProfile] = useState({
  name: "",
  email: "",
});
  const channels = useMemo(
    () => [
      { key: "instagram", name: "Instagram", status: "ACTIVE", icon: "/assets/insta.png" },
      { key: "linkedin", name: "LinkedIn", status: "CONNECTED", icon: "/assets/linkedin3.png" },
      { key: "tiktok", name: "TikTok", status: "ACTIVE", icon: "/assets/black.png" },
    ],
    []
  );

  return (
    <div className="settings-page dashboard-layout">
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

            <li onClick={() => router.push("/competitor-analysis")}>
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
        <div className="settings-topbar">

  {/* SEARCH */}
  <div className="settings-search">
    <span className="settings-search-icon">
      <IconSearch />
    </span>
    <input placeholder="Search data..." />
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
        <section className="settings-header">
          <h1>Account &amp; Team</h1>
        <p>
  Manage your editorial profile, connect channels, and access our intelligence support team.
</p>
        </section>

        <section className="settings-tabs" role="tablist" aria-label="Settings sections">
          <button
            type="button"
            className={activeTab === "account" ? "active" : ""}
            onClick={() => setActiveTab("account")}
          >
            ACCOUNT &amp; TEAM
          </button>
          <button
            type="button"
            className={activeTab === "billing" ? "active" : ""}
            onClick={() => router.push("/billing")}
          >
            BILLING &amp; PAYMENT
          </button>
          <button
            type="button"
            className={activeTab === "support" ? "active" : ""}
            onClick={() => {
    setActiveTab("support");
    router.push("/help");
}}
          >
            SUPPORT &amp; HELP
          </button>
<button
  type="button"
  className={activeTab === "notifications" ? "active" : ""}
onClick={() => router.push("/notifications")}>
  NOTIFICATIONS
</button>
        </section>

        <div className="settings-content">

  <div className="settings-left-column">

    {/* Company Profile */}
    <section className="settings-card settings-company">
      <div className="settings-card-header">
        <h2>Company Profile</h2>
        <button type="button" className="settings-save">
          SAVE CHANGES
        </button>
      </div>

      <div className="settings-company-body">
     <div className="settings-logo">
  <div className="settings-logo-box">
    <img
      src="/assets/com.png"
      alt="Company Logo"
      className="settings-company-image"
    />
  </div>

<button
  className="settings-logo-edit"
  type="button"
  aria-label="Edit logo"
>
  <img src="/assets/cam.png" alt="edit icon" />
</button>
</div>

        <form
          className="settings-form"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="settings-grid2">
            <div className="settings-field">
              <label>COMPANY NAME</label>
              <input
  value={settingsData?.profile?.name || ""}
  readOnly
/>
            </div>

            <div className="settings-field">
              <label>WEBSITE</label>
              <input defaultValue="https://axiom.media" />
            </div>
          </div>

          <div className="settings-field">
            <label>BRAND TAGLINE</label>
            <input defaultValue="Intelligence-driven growth for modern brands" />
          </div>
        </form>
      </div>
    </section>

    {/* Team Management INSIDE LEFT COLUMN */}
    <section className="settings-card settings-team">
      <div className="settings-card-header">
        <h2>Team Management</h2>

       <button type="button" className="settings-invite">
  <span className="settings-invite-ic">
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 20a8 8 0 0 1 16 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>

  INVITE MEMBER
</button>
      </div>

      <div className="settings-table">
        <div className="settings-tr settings-th">
          <div>MEMBER</div>
          <div>ROLE</div>
          <div className="settings-cell-right">ACTION</div>
        </div>

        <div className="settings-tr settings-td">
          <div className="settings-member">
            <div className="settings-member-avatar">
  <img src="/assets/a.jpg" alt="user avatar" />
</div>

            <div className="settings-member-meta">
              <div className="settings-member-name">
                Alex Rivera
              </div>

              <div className="settings-member-email">
                alex@axiom.media
              </div>
            </div>
          </div>

          <div>
            <span className="settings-role-pill">
              Admin
            </span>
          </div>

          <div className="settings-cell-right">
            <button
  type="button"
  className="settings-trash"
>
  <img src="/assets/bin.png" alt="Delete" />
</button>
          </div>
        </div>
      </div>
    </section>

  </div>

  {/* Right side */}
  <aside className="settings-card settings-channels">
    <div className="settings-card-header">
      <h2>Connected Channels</h2>
    </div>

    <div className="settings-channel-list">
      {channels.map((c) => (
        <div key={c.key} className="settings-channel">
          <div className="settings-channel-left">

            <div className={`settings-channel-icon ${c.key}`}>
              <img src={c.icon} alt="" />
            </div>

            <div className="settings-channel-meta">
              <div className="settings-channel-name">
                {c.name}
              </div>

              <div className="settings-channel-status">
                {c.status}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="settings-disconnect"
          >
            DISCONNECT
          </button>
        </div>
      ))}
    </div>
  </aside>

</div>
        </div>
      </main>
    </div>
  );
}