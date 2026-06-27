"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api";
import "./ActivityFeed.css";



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
const ActivityFeed = () => {
const [activities, setActivities] = useState<any[]>([]);
const [profile, setProfile] = useState<any>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadActivity();
}, []);

const loadActivity = async () => {
  try {
    setLoading(true);

    const profileData = await api.auth.profile();
    const activityData = await api.activity.get();
    console.log("Activity Data:", activityData);


    setActivities(activityData.activities || []);
    setProfile(profileData);
    

    
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};

const router = useRouter();
const pathname = usePathname();
const [selectedDate, setSelectedDate] = useState(new Date());


const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

const formatDate = (date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  });
  


  return (
    <div className="activity-page">

{/* SIDEBAR — matches Dashboard structure */}
<aside className="sidebar">
  <div className="brand-header">
    <span className="brand-main">GrowMarkt</span>
    <span className="brand-subtitle">THE DATA CURATOR</span>
  </div>

  <nav className="nav-menu">
    <ul>
      <li className={pathname === "/dashboard" ? "active" : ""} onClick={() => router.push("/dashboard")}>
        <img src="/assets/dashboard.png" alt="dashboard" className="nav-icon" />
        DASHBOARD
      </li>

      <li className={pathname === "/campaign-timeline" ? "active" : ""} onClick={() => router.push("/campaign-timeline")}>
        <img
          src="/assets/campaign.png"
          alt="campaign"
          className="nav-icon"
        />
        CAMPAIGN MANAGER
      </li>

      <li className={pathname === "/analytics" ? "active" : ""} onClick={() => router.push("/analytics")}>
        <img src="/assets/analytics.png" alt="analytics" className="nav-icon" />
        ANALYTICS
      </li>

      <li className={pathname === "/competitor-analysis" ? "active" : ""} onClick={() => router.push("/competitor-analysis")} style={{ cursor: "pointer" }}>
        <img src="/assets/competition.png" alt="competitors" className="nav-icon" />
        COMPETITORS
      </li>

      <li className={pathname === "/settings" ? "active" : ""} onClick={() => router.push("/settings")}>
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
      <main className="activity-main">

        {/* TOP BAR */}
        <div className="af-top">

          <div className="af-search-container">
            <span className="af-search-icon">
              
<IconSearch />
            </span>
            <input className="af-search" placeholder="Search insights..." />
          </div>

          <div className="af-user">

            <div className="af-user-left">

              <div className="af-notif-icon">
                <img src="/assets/bell.png" alt="notification" />
                <span className="af-dot"></span>
              </div>

              <div className="af-user-info">
<p className="af-name">
  {profile ? profile.name : "Loading..."}
</p>

<p className="af-role">
  {profile ? profile.email : ""}
</p>
              </div>

            </div>

            <img src="/assets/alex.jpg" alt="avatar" className="af-avatar" />

          </div>
          
        </div>
          <div className="back-button-container">
    <button
      type="button"
      className="vm-back"
      onClick={() => router.push("/dashboard")}
    >
      <span className="vm-back-arrow" aria-hidden="true">
        ←
      </span>
      Back to Dashboard
    </button>
  </div>

        {/* HEADER */}
        <div className="af-header">

          <div className="af-header-left">
            <p className="af-label">SYSTEM LOGS</p>
            <h1 className="af-title">Activity Feed</h1>
            <p className="af-sub">
              A real-time editorial ledger tracking all growth actions,
              competitor shifts, and system health across your portfolio.
            </p>
          </div>

        <div className="af-date-box">
  <img src="/assets/cal.png" alt="calendar" className="af-cal-icon" />

  <span>
    {formatDate(startDate)} - {formatDate(endDate)}
  </span>

  <img
    src="/assets/down.png"
    alt="dropdown"
    className="af-down-icon"
    onClick={() => {
  const picker = document.getElementById(
    "realDatePicker"
  ) as HTMLInputElement | null;

  picker?.showPicker?.();
}}
  />

  <input
    id="realDatePicker"
    type="month"
    className="af-hidden-picker"
    value={`${selectedDate.getFullYear()}-${String(
      selectedDate.getMonth() + 1
    ).padStart(2, "0")}`}
    onChange={(e) => {
      const [year, month] = e.target.value.split("-");
      setSelectedDate(new Date(year, month - 1));
    }}
  />
</div>
        </div>

        {/* FILTERS */}
        <div className="af-filters">

          <span className="af-filter active">
            <img src="/assets/act1.png" alt="all" />
            All Activity
          </span>

          <span className="af-filter">
            <img src="/assets/act2.png" alt="published" />
            Published
          </span>

<span
  className="af-filter"
  onClick={() => router.push("/competitor-analysis")}
  style={{ cursor: "pointer" }}
>
  <img src="/assets/act3.png" alt="competitors" />
  Competitors
</span>

          <span className="af-filter">
            <img src="/assets/act4.png" alt="team" />
            Team
          </span>

          <span className="af-filter">
            <img src="/assets/act5.png" alt="alerts" />
            Alerts
          </span>

        </div>

        {/* FEED */}
        <div className="af-feed">

          <p className="af-day">TODAY, OCT 24</p>
          <div className="af-divider"></div>

          {loading ? (
  <p>Loading...</p>
) : activities.length === 0 ? (
  <p>No Activity Found</p>
) : (
  activities.map((item: any) => (
    <div className="af-item" key={item.id || item._id}>

      <div className="af-icon success">
        <img src="/assets/tick.png" alt="" />
      </div>

      <div className="af-content">

        <div className="af-row">
          <h3>{item.title}</h3>
          
<span className="af-time">
  {new Date(item.createdAt).toLocaleString()}
</span>
        </div>

        <p>{item.description}</p>

        <div className="af-meta">
          <div className="af-user-mini">
            <span>{item.actor}</span>
          </div>
        </div>

      </div>

    </div>
  ))
)}

          <div className="af-load">LOAD OLDER ACTIVITY</div>

        </div>
      </main>
    </div>
  );
};

export default ActivityFeed;