"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, BillingData } from "@/lib/api";
import { useAuth } from "@/lib/auth-context"; 
import "./billing.css";

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

function IconDownload(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 3v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M8 11l4 4 4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4 21h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconArrowRight(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M5 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconContactless(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M8.2 8.3c2.7 2.7 2.7 7.1 0 9.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M11.1 6c4 4 4 10.5 0 14.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M14 3.8c5.7 5.7 5.7 15 0 20.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

export default function Billing() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth(); // ✅ ADD THIS
  const [profile, setProfile] = useState<any>(null); // ✅ ADD THIS
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadBilling = async () => {
    console.log("Loading billing...");
    try {
      const data = await api.billing.get();
      console.log("Billing response =", JSON.stringify(data, null, 2));
      setBilling(data);
    } catch (err) {
      console.error("Billing error:", err);
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  const loadData = async () => {
    try {
      // Fetch both billing and profile
      const [billingData, profileData] = await Promise.all([
        api.billing.get(),
        api.auth.profile()
      ]);
      setBilling(billingData);
      setProfile(profileData);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };
  loadData();
}, []);
  // Safe accessors with the same visual fallbacks you already had
  const plan = billing?.plan ?? "—";
  const price = billing?.price ?? "0";
  const billingCycle = billing?.billingCycle ?? "mo";
  const nextInvoiceDate = billing?.nextInvoiceDate
    ? new Date(billing.nextInvoiceDate).toLocaleDateString()
    : "-";

  const channelsUsed = billing?.usage?.channelsUsed ?? 0;
  const channelsLimit = billing?.usage?.channelsLimit ?? 1;
  const postsUsed = billing?.usage?.postsUsed ?? 0;
  const postsLimit = billing?.usage?.postsLimit ?? 1;
  const storageUsed = billing?.usage?.storageUsed ?? 0;
  const storageLimit = billing?.usage?.storageLimit ?? 10;

  const channelsPct = Math.min(100, (channelsUsed / channelsLimit) * 100);
  const postsPct = Math.min(100, (postsUsed / postsLimit) * 100);
  const storagePct = Math.min(100, (storageUsed / storageLimit) * 100);
  const totalCapacityPct = Math.round((channelsPct + postsPct + storagePct) / 3);

  const history = billing?.history ?? [];

  // Payment method (falls back to previous hardcoded look if backend doesn't send it yet)
  const cardLast4 = billing?.paymentMethod?.last4 ?? "4242";
  const cardholder = billing?.paymentMethod?.cardholder ?? "ALEXANDER CROW";
  const cardExpiry = billing?.paymentMethod?.expiry ?? "12/25";

  // User profile in topbar (same visual defaults as before)
  const userName = profile?.name || user?.name || "Alex Mercer";
  const userRole = profile?.email || "PREMIUM CURATOR";
  const userAvatar = profile?.avatar || user?.image || "/assets/alex.jpg";
  const notificationCount = billing?.notifications ?? 1;

  const handleDownload = async (invoiceId: string) => {
    try {
      await api.billing.downloadInvoice?.(invoiceId);
    } catch (err) {
      console.error("Download invoice error:", err);
    }
  };

  const handleChangePlan = async () => {
    try {
      // If your API has a change-plan endpoint, call it here.
      // Otherwise navigate to the plan selection page.
      if (api.billing.changePlan) {
        await api.billing.changePlan();
        await loadBilling();
      } else {
        router.push("/change-plan");
      }
    } catch (err) {
      console.error("Change plan error:", err);
    }
  };

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
            <li
              onClick={() => router.push("/competitor-analysis")}
              style={{ cursor: "pointer" }}
            >
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
                {notificationCount > 0 && <span className="dot"></span>}
              </div>
              <div className="profile-info">
                <p className="user-name">{userName}</p>
                <p className="user-role">{userRole}</p>
              </div>
            </div>
            <img src={userAvatar} alt="avatar" className="avatar" />
          </div>
        </header>

        <section className="settings-header">
          <h1>Billing &amp; Payment</h1>
          <p>Manage your subscription, payment methods, and billing history.</p>
        </section>

        <section className="settings-tabs" role="tablist" aria-label="Settings sections">
          <button type="button" onClick={() => router.push("/settings")}>
            ACCOUNT &amp; TEAM
          </button>
          <button type="button" className="active">
            BILLING &amp; PAYMENT
          </button>
          <button type="button" onClick={() => router.push("/help")}>
            SUPPORT &amp; HELP
          </button>
          <button type="button" onClick={() => router.push("/notifications")}>
            NOTIFICATIONS
          </button>
        </section>

        <section className="billing-body">
          <div className="billing-left">
            <div className="billing-plan-row">
              <div className="billing-card billing-current-plan">
                <div className="billing-plan-label">CURRENT PLAN</div>
                <div className="billing-plan-name">{plan}</div>
                <div className="billing-plan-next">
                  Next billing date: {nextInvoiceDate}
                </div>
              </div>

              <div className="billing-card billing-price-card">
                <div className="billing-price">
                  <span className="billing-price-amount">${price}</span>
                  <span className="billing-price-suffix">/{billingCycle}</span>
                </div>
                <button
                  type="button"
                  className="billing-change-plan"
                  onClick={handleChangePlan}
                >
                  CHANGE PLAN
                </button>
              </div>
            </div>

            <div className="billing-card billing-usage">
              <div className="billing-usage-head">
                <div className="billing-usage-title">Resource Usage</div>
                <div className="billing-usage-cap">{totalCapacityPct}% TOTAL CAPACITY</div>
              </div>

              <div className="billing-usage-list">
                <div className="billing-usage-item">
                  <div className="billing-usage-top">
                    <div className="billing-usage-label">SOCIAL CHANNELS</div>
                    <div className="billing-usage-val">
                      {channelsUsed}/{channelsLimit}
                      <span>USED</span>
                    </div>
                  </div>
                  <div className="billing-bar">
                    <div
                      className="billing-bar-fill"
                      style={{ width: `${channelsPct}%` }}
                    />
                  </div>
                </div>

                <div className="billing-usage-item">
                  <div className="billing-usage-top">
                    <div className="billing-usage-label">MONTHLY POSTS</div>
                    <div className="billing-usage-val">
                      {postsUsed}/{postsLimit} <span>USED</span>
                    </div>
                  </div>
                  <div className="billing-bar">
                    <div
                      className="billing-bar-fill"
                      style={{ width: `${postsPct}%` }}
                    />
                  </div>
                </div>

                <div className="billing-usage-item">
                  <div className="billing-usage-top">
                    <div className="billing-usage-label">DATA STORAGE</div>
                    <div className="billing-usage-val">
                      {storageUsed}GB/{storageLimit}GB
                      <span>USED</span>
                    </div>
                  </div>
                  <div className="billing-bar">
                    <div
                      className="billing-bar-fill"
                      style={{ width: `${storagePct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="billing-card billing-history">
              <div className="billing-history-head">
                <div className="billing-history-title">Billing History</div>
                <button type="button" className="billing-viewall">
                  VIEW ALL <span aria-hidden="true"><IconArrowRight /></span>
                </button>
              </div>

              <div className="billing-table">
                <div className="billing-tr billing-th">
                  <div>INVOICE ID</div>
                  <div>DATE</div>
                  <div>AMOUNT</div>
                  <div>STATUS</div>
                  <div className="billing-cell-right">ACTION</div>
                </div>

                {history.map((row) => (
                  <div key={row.id} className="billing-tr billing-td">
                    <div className="billing-invoice">{row.invoiceId}</div>
                    <div className="billing-date">
                      {new Date(row.date).toLocaleDateString()}
                    </div>
                    <div className="billing-amount">${row.amount}</div>
                    <div>
                      <span className="billing-pill">{row.status}</span>
                    </div>
                    <div className="billing-cell-right">
                      <button
                        className="billing-download"
                        onClick={() => handleDownload(row.invoiceId)}
                      >
                        <IconDownload />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="billing-banner">
              <div className="billing-banner-inner">
                <div className="billing-banner-title">
                  Need help with your enterprise billing?
                </div>
                <div className="billing-banner-sub">
                  Connect with our specialized billing team to discuss custom invoicing,
                  multi-region tax compliance, and large-scale team management.
                </div>
                <button
                  type="button"
                  className="billing-banner-btn"
                  onClick={() => router.push("/support")}
                >
                  CONTACT BILLING SUPPORT
                </button>
              </div>
            </div>
          </div>

          <aside className="billing-right">
            <div className="billing-credit">
              <div className="billing-credit-top">
                <div className="billing-credit-title">PRIMARY CARD</div>
                <div className="billing-credit-ic" aria-hidden="true">
                  <img
                    src="/assets/card.png"
                    alt="Contactless Card"
                    className="billing-credit-ic"
                  />
                </div>
              </div>

              <div
                className="billing-credit-numberline"
                aria-label={`Card number ending in ${cardLast4}`}
              >
                <div className="billing-credit-masked" aria-hidden="true">
                  <span>****</span>
                  <span>****</span>
                  <span>****</span>
                </div>
                <div className="billing-credit-last4">{cardLast4}</div>
              </div>

              <div className="billing-credit-meta">
                <div className="billing-credit-field">
                  <div className="billing-credit-label">CARDHOLDER NAME</div>
                  <div className="billing-credit-value">{cardholder}</div>
                </div>
                <div className="billing-credit-field billing-credit-field-right">
                  <div className="billing-credit-label">EXPIRY DATE</div>
                  <div className="billing-credit-value">{cardExpiry}</div>
                </div>
              </div>

              <button
                type="button"
                className="billing-credit-btn"
                onClick={() => router.push("/payment-method")}
              >
                <img src="/assets/add.png" alt="Add" />
                ADD NEW PAYMENT METHOD
              </button>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}