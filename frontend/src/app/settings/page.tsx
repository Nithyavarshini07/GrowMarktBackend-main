"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import "../dashboard/Dashboard.css";
import "../settings/settings.css";

function IconSearch(props: any) {
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

export default function Settings() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("account");
  const [settingsData, setSettingsData] = useState<any>(null);

  // Form state for Company Profile
  const [companyForm, setCompanyForm] = useState({
    name: "",
    website: "",
    tagline: "",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const data = await api.settings.get();
      console.log(data);
      setSettingsData(data);

      // Fill the form with real data
      setCompanyForm({
        name: data?.profile?.name || "",
        website: data?.profile?.website || "",
        tagline: data?.profile?.tagline || "",
      });
    } catch (error) {
      console.error(error);
    }
  }

  // ---------- Actions ----------
  async function handleSaveProfile() {
    try {
      await api.settings.updateProfile(companyForm);
      alert("Profile saved!");
      loadSettings();
    } catch (err) {
      console.error(err);
      alert("Failed to save profile");
    }
  }

  async function handleInviteMember() {
    const email = prompt("Enter email of the person you want to invite:");
    if (!email) return;

    try {
      await api.settings.inviteMember({ email });
      alert("Invitation sent!");
      loadSettings();
    } catch (err) {
      console.error(err);
      alert("Failed to invite member");
    }
  }

  async function handleRemoveMember(member: any) {
    if (!confirm(`Remove ${member.name} from the team?`)) return;

    try {
      await api.settings.removeMember(member.id);
      alert("Member removed");
      loadSettings();
    } catch (err) {
      console.error(err);
      alert("Failed to remove member");
    }
  }

  async function handleDisconnectChannel(channelKey: string, channelName: string) {
    if (!confirm(`Disconnect ${channelName}?`)) return;

    try {
      await api.settings.disconnectChannel(channelKey);
      alert(`${channelName} disconnected`);
      loadSettings();
    } catch (err) {
      console.error(err);
      alert("Failed to disconnect channel");
    }
  }

  // Use channels from backend if available, otherwise keep the old hardcoded list
  // so the UI never breaks
  const channels = settingsData?.channels || [
    {
      key: "instagram",
      name: "Instagram",
      status: "ACTIVE",
      icon: "/assets/insta.png",
    },
    {
      key: "linkedin",
      name: "LinkedIn",
      status: "CONNECTED",
      icon: "/assets/linkedin3.png",
    },
    {
      key: "tiktok",
      name: "TikTok",
      status: "ACTIVE",
      icon: "/assets/black.png",
    },
  ];

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
                <p className="user-name">{settingsData?.profile?.name}</p>
                <p className="user-role">{settingsData?.profile?.email}</p>
              </div>
            </div>
            <img src="/assets/alex.jpg" alt="avatar" className="avatar" />
          </div>
        </div>

        <div className="page-content">
          <section className="settings-header">
            <h1>Account &amp; Team</h1>
            <p>
              Manage your editorial profile, connect channels, and access our intelligence
              support team.
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
              onClick={() => router.push("/notifications")}
            >
              NOTIFICATIONS
            </button>
          </section>

          <div className="settings-content">
            <div className="settings-left-column">
              {/* Company Profile */}
              <section className="settings-card settings-company">
                <div className="settings-card-header">
                  <h2>Company Profile</h2>
                  <button
                    type="button"
                    className="settings-save"
                    onClick={handleSaveProfile}
                  >
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

                  <form className="settings-form" onSubmit={(e) => e.preventDefault()}>
                    <div className="settings-grid2">
                      <div className="settings-field">
                        <label>COMPANY NAME</label>
                        <input
                          value={companyForm.name}
                          onChange={(e) =>
                            setCompanyForm({ ...companyForm, name: e.target.value })
                          }
                        />
                      </div>
                      <div className="settings-field">
                        <label>WEBSITE</label>
                        <input
                          value={companyForm.website}
                          onChange={(e) =>
                            setCompanyForm({ ...companyForm, website: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="settings-field">
                      <label>BRAND TAGLINE</label>
                      <input
                        value={companyForm.tagline}
                        onChange={(e) =>
                          setCompanyForm({ ...companyForm, tagline: e.target.value })
                        }
                      />
                    </div>
                  </form>
                </div>
              </section>

              {/* Team Management */}
              <section className="settings-card settings-team">
                <div className="settings-card-header">
                  <h2>Team Management</h2>
                  <button
                    type="button"
                    className="settings-invite"
                    onClick={handleInviteMember}
                  >
                    <span className="settings-invite-ic">
                      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

                  {settingsData?.team?.map((member: any) => (
                    <div key={member.id} className="settings-tr settings-td">
                      <div className="settings-member">
                        <div className="settings-member-avatar">
                          <img src="/assets/a.jpg" alt="avatar" />
                        </div>
                        <div className="settings-member-meta">
                          <div className="settings-member-name">{member.name}</div>
                          <div className="settings-member-email">{member.email}</div>
                        </div>
                      </div>
                      <div>
                        <span className="settings-role-pill">{member.role}</span>
                      </div>
                      <div className="settings-cell-right">
                        <button
                          type="button"
                          className="settings-trash"
                          onClick={() => handleRemoveMember(member)}
                        >
                          <img src="/assets/bin.png" alt="Delete" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right side - Channels */}
            <aside className="settings-card settings-channels">
              <div className="settings-card-header">
                <h2>Connected Channels</h2>
              </div>
              <div className="settings-channel-list">
                {channels.map((c: any) => (
                  <div key={c.key} className="settings-channel">
                    <div className="settings-channel-left">
                      <div className={`settings-channel-icon ${c.key}`}>
                        <img src={c.icon} alt="" />
                      </div>
                      <div className="settings-channel-meta">
                        <div className="settings-channel-name">{c.name}</div>
                        <div className="settings-channel-status">{c.status}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="settings-disconnect"
                      onClick={() => handleDisconnectChannel(c.key, c.name)}
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