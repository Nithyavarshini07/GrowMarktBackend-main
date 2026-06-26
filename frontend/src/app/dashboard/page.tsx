"use client";
import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

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

const Dashboard = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState(null);
  const [social, setSocial] = useState<any>(null);
  const [calendarPosts, setCalendarPosts] = useState<any[]>([]);



  // Call fetchPosts when the component loads
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);

      const postsData = await api.posts.list();
      const profileData = await api.auth.profile();
      const dashboardData = await api.dashboard.overview();
      const chart = await api.analytics.growthVsEngagement();
      console.log("Chart Data:", chart);
      const activityData = await api.activity.get();
      console.log(activityData);
      const scheduleData = await api.schedule.list();

console.log("Schedule Data:", scheduleData);
      const socialData = await api.social.status();


  
      setPosts(postsData);
      setProfile(profileData);
      setDashboard(dashboardData);
      setChartData(chart.data);
      setActivity(activityData.activities || []);
   
      setSocial(socialData);
    setSchedule(scheduleData.posts || []);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

const router = useRouter();
const today = new Date();

const days = ["S", "M", "T", "W", "T", "F", "S"];

// Get current month details
const year = today.getFullYear();
const month = today.getMonth();

// First day of month
const firstDay = new Date(year, month, 1).getDay();

// Number of days in month
const totalDays = new Date(year, month + 1, 0).getDate();

// Create empty slots + dates
const calendarDays = [];

// empty slots before month start
for (let i = 0; i < firstDay; i++) {
  calendarDays.push(null);
}

// actual dates
for (let d = 1; d <= totalDays; d++) {
  calendarDays.push(d);
}

const values = Array.isArray(chartData)
  ? chartData.map((item: any) => item.value)
  : [];

const max = Math.max(...values, 1);
const scheduledDates = new Set(
  calendarPosts.map((post: any) => {
    return new Date(post.scheduledAt).getDate();
  })
);

  return (
    <div className="dashboard">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand-header">
                  <span className="brand-main">GrowMarkt</span>
          <span className="brand-subtitle">THE DATA CURATOR</span>
  
        </div>

        <nav>
          <ul>
            <li className="active">
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

<li onClick={() => router.push("/analytics")}>
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
<p className="user-name">
  {profile ? profile.name : "Loading..."}
</p>

<p className="user-role">
  {profile ? profile.email : ""}
</p>
               
              </div>

            </div>

            <img src="/assets/alex.jpg" alt="avatar" className="avatar" />

          </div>

        </div>

        {/* METRIC CARDS */}
        <div className="cards">

          <div className="card">
            <h4>TOTAL REACH</h4>
            <h2>{posts.length}</h2>
            <p className="trend">
              <img src="/assets/rate.png" className="trend-icon" />
              <span className="positive">14.2%</span>
              <span className="trend-text">vs last month</span>
            </p>
          </div>

          <div className="card">
            <h4>ENGAGEMENT RATE</h4>
            <h2>{dashboard?.engagementRate ?? "0%"}</h2>
            <p className="trend">
              <img src="/assets/rate.png" className="trend-icon" />
              <span className="positive">0.9%</span>
              <span className="trend-text">vs last month</span>
            </p>
          </div>

          <div className="card">
            <h4>FOLLOWER GROWTH</h4>
            <h2>{dashboard?.followerGrowth ?? "0"}</h2>  
            <p className="trend">
              <img src="/assets/rate2.png" className="trend-icon" />
              <span className="negative">2.1%</span>
              <span className="trend-text">vs last month</span>
            </p>
          </div>

        </div>

        {/* MIDDLE + RIGHT CONTENT (FIXED STRUCTURE) */}
        <div className="content-grid">

          {/* CHART */}
          <div className="chart-card">

            <div className="chart-header">

              <div className="chart-title">
                <h3>Audience Expansion</h3>
                <p className="subtext">Last 30 days growth analysis</p>
              </div>

              <div className="toggle-btns">
                <button className="active">DAILY</button>
                <button>WEEKLY</button>
              </div>

            </div>

            <div className="bars-wrapper">

              <div className="bars-container">
{values.map((val, i) => {
  const height = (val / max) * 100;

  let color = "#E5EEFF"; // default

  if (i === 4) {
    color = "#102A43"; // 5th bar
  } else if (i === 7) {
    color = "#6BFF8F"; // 8th bar
  }

  return (
    <div
      key={i}
      className="bar"
      style={{
        height: `${height}%`,
        backgroundColor: color,
      }}
    />
  );
})}          </div>

              <div className="bar-labels">
  <span>01 OCT</span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span>15 OCT</span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span>30 OCT</span>
</div>

            </div>

          </div>

{/* ACTIVITY */}
<div className="activity-card">

  <h3>Recent Activity</h3>

  <div className="activity-list">
    {activity.map((item: any) => (
      <div className="activity-item" key={item.id}>
        <div className="activity-content">
          <p className="act-title">{item.title}</p>
          <p className="act-desc">{item.description}</p>
          <p className="act-time">{item.time}</p>
        </div>
      </div>
    ))}
  </div>

  <button
    className="view-all"
    onClick={() => router.push("/activity-feed")}
  >
    VIEW ALL ACTIVITY
  </button>

</div>
</div> 

        {/* BOTTOM SECTION */}
<div className="bottom-section">

  {/* LEFT - CALENDAR */}
  <div className="calendar-section">
    <h3>Post Calendar</h3>

    <div className="calendar-widget">

      <div className="cal-header">
        <span>OCTOBER 2023</span>

        <div className="cal-nav">
          <span>{"<"}</span>
          <span>{">"}</span>
        </div>
      </div>

      <div className="cal-grid">
        {days.map((d, i) => (
          <span key={i} className="day-label">{d}</span>
        ))}

{calendarDays.map((d, i) => {
  if (!d) {
    return (
      <span key={i} className="date">
      </span>
    );
  }

  const hasPost = calendarPosts.some((post: any) => {
    const postDate = new Date(post.scheduledAt);

    return (
      postDate.getDate() === d &&
      postDate.getMonth() === month &&
      postDate.getFullYear() === year
    );
  });

  return (
    <span
      key={i}
      className={`date
      ${d === today.getDate() ? "active-date" : ""}
      ${hasPost ? "has-post" : ""}`}
    >
      {d}
    </span>
  );
})}
      </div>

    </div>
  </div>

  {/* RIGHT - SCHEDULE */}
{/* RIGHT - SCHEDULE */}
<div className="schedule-section">

  <h3><b>NEXT 3 SCHEDULED</b></h3>

  <div className="schedule-list">

{schedule.slice(0, 3).map((post) => (
  <div className="schedule-card" key={post._id}>
    <p className="title">{post.headline}</p>

    <p className="time">
      <img src="/assets/time.png" alt="time" className="time-icon" />
      {post.scheduledAt
        ? new Date(post.scheduledAt).toLocaleString()
        : "Not Scheduled"}
    </p>
  </div>
))}

  </div>
</div>


<div className="platforms-wrapper">
  <div className="platforms-grid">

    <div className="p-card dark">
      <span className="label">INSTAGRAM</span>
      <h2>
  {social?.instagram?.connected ? "Connected" : "Not Connected"}
</h2>
      <div className="bar insta"></div>
    </div>

    <div className="p-card">
      <span className="label">LINKEDIN</span>
      <h2>
  {social?.linkedin?.connected ? "Connected" : "Not Connected"}
</h2>
      <div className="bar linkedin"></div>
    </div>

    <div className="p-card">
      <span className="label">X (TWITTER)</span>
      <h2>
  {social?.twitter?.connected ? "Connected" : "Not Connected"}
</h2>
      <div className="bar twitter"></div>
    </div>

    <div className="p-card">
      <span className="label">FACEBOOK</span>
      <h2>
  {social?.facebook?.connected ? "Connected" : "Not Connected"}
</h2>
      <div className="bar facebook"></div>
    </div>

  </div>
</div>


        </div>

      </main>

    </div>
  );
};

export default Dashboard;