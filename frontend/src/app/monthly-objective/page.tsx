"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import "./monthlyObjective.css";

const MONTHS = [
  "September 2023",
  "October 2023",
  "November 2023",
  "December 2023",
  "January 2024",
];

export default function MonthlyObjective() {
const router = useRouter();
  const [month, setMonth] = useState("November 2023");
  const [reach, setReach] = useState("3.0M");
  const [postCount, setPostCount] = useState("48");
  const [engagementRate, setEngagementRate] = useState(4.5);

  const engagementPct = useMemo(() => {
    const v = Number.isFinite(engagementRate) ? engagementRate : 0;
    return Math.max(0, Math.min(10, v));
  }, [engagementRate]);

  return (
    <div className="mo-page">
      <div className="mo-bg">
        <aside className="mo-sidebar" aria-hidden="true">
          <div className="mo-brand">
            <div className="mo-brand-title">DataCurator</div>
            <div className="mo-brand-sub">Global Reach</div>
          </div>

          <div className="mo-nav">
            <div className="mo-nav-item mo-nav-active">
              <span className="mo-nav-dot" />
              <span>Objectives</span>
            </div>
            <div className="mo-nav-item">
              <span className="mo-nav-ico" />
              <span>Dashboard</span>
            </div>
            <div className="mo-nav-item">
              <span className="mo-nav-ico" />
              <span>Timeline</span>
            </div>
          </div>
        </aside>

        <div className="mo-top" aria-hidden="true">
          <div className="mo-top-tabs">
            <div className="mo-top-tab">Analytics</div>
            <div className="mo-top-tab">Campaigns</div>
            <div className="mo-top-tab mo-top-tab-active">Objectives</div>
            <div className="mo-top-tab">Reports</div>
          </div>
          <div className="mo-top-icons">
            <span className="mo-top-ico" />
            <span className="mo-top-ico" />
          </div>
        </div>

        <div className="mo-blur-layer" aria-hidden="true" />
      </div>

      <div className="mo-overlay" role="presentation">
        <div className="mo-modal" role="dialog" aria-modal="true" aria-label="Set new monthly objective">
          <button className="mo-close" onClick={() => router.back(-1)} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M7 7l10 10M17 7 7 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <div className="mo-kicker">STRATEGY MANAGEMENT</div>
          <div className="mo-title">Set New Monthly Objective</div>
          <div className="mo-accent" />

          <div className="mo-label">TARGET MONTH</div>
          <div className="mo-select">
            <select value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Target month">
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <span className="mo-select-chev" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M7 10l5 5 5-5"
                  stroke="#64748B"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>

          <div className="mo-section">
            <div className="mo-section-head">
              <span className="mo-section-ico" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 16.6 9.2 11.4l3 3L20 6.6"
                    stroke="#16A34A"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M20 6.6h-4.2" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              <span className="mo-section-title">GROWTH PERFORMANCE TARGETS</span>
            </div>

            <div className="mo-row">
              <div className="mo-row-left">
                <div className="mo-row-label">TARGET REACH</div>
                <div className="mo-row-sub">Projected monthly impressions</div>
              </div>
              <input
                className="mo-value"
                value={reach}
                onChange={(e) => setReach(e.target.value)}
                aria-label="Target reach"
              />
            </div>

            <div className="mo-row">
              <div className="mo-row-left">
                <div className="mo-row-label">POST COUNT</div>
                <div className="mo-row-sub">Monthly publishing volume</div>
              </div>
              <input
                className="mo-value"
                value={postCount}
                onChange={(e) => setPostCount(e.target.value)}
                aria-label="Post count"
              />
            </div>

            <div className="mo-row mo-row-eng">
              <div className="mo-eng-top">
                <div className="mo-row-left">
                  <div className="mo-row-label">ENGAGEMENT RATE</div>
                  <div className="mo-row-sub">Target interaction percentage</div>
                </div>
                <div className="mo-eng-num" aria-label="Engagement rate value">
                  {engagementPct.toFixed(1)}%
                </div>
              </div>

              <div className="mo-bar" aria-hidden="true">
                <div className="mo-bar-fill" style={{ width: `${(engagementPct / 10) * 100}%` }} />
              </div>

              <div className="mo-eng-scale">
                <span>0% BASE</span>
                <span>10% GROWTH CAP</span>
              </div>
            </div>
          </div>

          <button className="mo-primary" onClick={() => router.back(-1)}>
            SET OBJECTIVE
          </button>
          <button className="mo-secondary" onClick={() => router.back(-1)}>
            CANCEL &amp; RETURN
          </button>
        </div>
      </div>
    </div>
  );
}