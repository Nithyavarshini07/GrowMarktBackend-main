"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import "./createUnifiedPost.css";



export default function CreateUnifiedPost() {
  const router = useRouter();
  const [selectedChannel, setSelectedChannel] = useState("share");
  const [scheduleEnabled, setScheduleEnabled] = useState(true);

  const channelButtons = useMemo(
    () => [
      {
        id: "share",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M16.5 7.7a3 3 0 1 0-2.9-3.6"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              opacity=".0"
            />
            <path
              d="M16.9 8.2a2.9 2.9 0 1 0 0-5.8 2.9 2.9 0 0 0 0 5.8Z"
              stroke="currentColor"
              strokeWidth="1.9"
            />
            <path
              d="M7.1 14.9a2.9 2.9 0 1 0 0-5.8 2.9 2.9 0 0 0 0 5.8Z"
              stroke="currentColor"
              strokeWidth="1.9"
            />
            <path
              d="M16.9 22a2.9 2.9 0 1 0 0-5.8 2.9 2.9 0 0 0 0 5.8Z"
              stroke="currentColor"
              strokeWidth="1.9"
            />
            <path
              d="M9.6 11.4 14.7 8.6"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
            />
            <path
              d="M9.6 12.6 14.7 15.4"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
      {
        id: "camera",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M7 7.6h2.2l1.2-1.7h3.2l1.2 1.7H17a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3Z"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinejoin="round"
            />
            <path
              d="M12 16.2a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2Z"
              stroke="currentColor"
              strokeWidth="1.9"
            />
          </svg>
        ),
      },
      {
        id: "link",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M10.3 13.7 8.6 15.4a3.8 3.8 0 0 1-5.4-5.4l1.7-1.7a3.8 3.8 0 0 1 5.4 0"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M13.7 10.3 15.4 8.6a3.8 3.8 0 1 1 5.4 5.4l-1.7 1.7a3.8 3.8 0 0 1-5.4 0"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9.3 14.7 14.7 9.3"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
      {
        id: "globe",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
              stroke="currentColor"
              strokeWidth="1.9"
            />
            <path
              d="M3.3 12h17.4"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
            />
            <path
              d="M12 3a13.2 13.2 0 0 1 0 18"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
            />
            <path
              d="M12 3a13.2 13.2 0 0 0 0 18"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
      {
        id: "video",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6.8 7.2h8.4a2.6 2.6 0 0 1 2.6 2.6v4.4a2.6 2.6 0 0 1-2.6 2.6H6.8a2.6 2.6 0 0 1-2.6-2.6V9.8a2.6 2.6 0 0 1 2.6-2.6Z"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinejoin="round"
            />
            <path
              d="M12 10.3v3.4l3-1.7-3-1.7Z"
              fill="currentColor"
            />
          </svg>
        ),
      },
    ],
    []
  );

  return (
    <div className="cup-page">
      <div className="cup-topbar">
        <div className="cup-brand">DataCurator</div>
        <div className="cup-nav">
          <a className="cup-nav-item" href="#analytics">
            ANALYTICS
          </a>
          <a className="cup-nav-item cup-nav-active" href="#planner">
            PLANNER
          </a>
          <a className="cup-nav-item" href="#library">
            LIBRARY
          </a>
          <a className="cup-nav-item" href="#audience">
            AUDIENCE
          </a>
        </div>
        <div className="cup-top-right">
          <div className="cup-bell" aria-label="Notifications">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M18.3 16.4H5.7c1.1-1.2 1.8-2.6 1.8-4.8 0-2.9 1.9-5.4 4.6-6.2V4.4a1 1 0 1 1 2 0v1c2.7.8 4.6 3.3 4.6 6.2 0 2.2.7 3.6 1.8 4.8Z"
                stroke="#334155"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M10 18.5a2.2 2.2 0 0 0 4 0"
                stroke="#334155"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="cup-avatar" aria-label="User avatar" />
        </div>
      </div>

      <div className="cup-backdrop" aria-hidden="true" />

      <div className="cup-modal" role="dialog" aria-modal="true" aria-label="Create Unified Post">
        <div className="cup-modal-head">
          <div className="cup-modal-titlewrap">
            <div className="cup-title">Create Unified Post</div>
            <div className="cup-subtitle">CAMPAIGN: Q4 GROWTH STRATEGY</div>
          </div>
<button
  className="cup-close"
  aria-label="Close"
  onClick={() => router.push("/campaign-timeline")}
>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M6 6l12 12M18 6 6 18"
      stroke="#0F172A"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
</button>
        </div>

        <div className="cup-divider" />

        <div className="cup-body">
          <div className="cup-left">
            <div className="cup-section">
              <div className="cup-section-title">TARGET CHANNELS</div>
              <div className="cup-channels">
                {channelButtons.map((c) => (
                  <button
                    key={c.id}
                    className={`cup-channel-btn ${selectedChannel === c.id ? "is-active" : ""}`}
                    onClick={() => setSelectedChannel(c.id)}
                    type="button"
                    aria-label={c.id}
                  >
                    {c.icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="cup-section cup-section-editor">
              <div className="cup-section-row">
                <div className="cup-section-title">EDITORIAL CONTENT</div>
                <div className="cup-counter">428 / 2,200</div>
              </div>
              <div className="cup-editor">
                <textarea
                  className="cup-textarea"
                  defaultValue=""
                  placeholder="Write your post insights here... Use #hashtags to increase organic reach across your connected platforms."
                />
                <div className="cup-editor-actions" aria-hidden="true">
                  <div className="cup-editor-ico">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
                        stroke="#94A3B8"
                        strokeWidth="1.8"
                      />
                      <path
                        d="M9.4 10.1a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Z"
                        fill="#94A3B8"
                      />
                      <path
                        d="M14.6 10.1a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Z"
                        fill="#94A3B8"
                      />
                      <path
                        d="M8.4 14.3c.9 1.5 2.1 2.2 3.6 2.2 1.6 0 2.8-.7 3.6-2.2"
                        stroke="#94A3B8"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div className="cup-editor-ico cup-editor-ico-at">@</div>
                </div>
              </div>
            </div>

            <div className="cup-section">
              <div className="cup-section-title">VISUAL ASSETS</div>
              <div className="cup-assets">
                <div className="cup-upload">
                  <div className="cup-upload-ico" aria-hidden="true">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M7 20.2h10a3 3 0 0 0 3-3V9.8a3 3 0 0 0-3-3h-1.7l-1.3-1.8H10l-1.3 1.8H7a3 3 0 0 0-3 3v7.4a3 3 0 0 0 3 3Z"
                        stroke="#CBD5E1"
                        strokeWidth="1.7"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 16.4a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
                        stroke="#CBD5E1"
                        strokeWidth="1.7"
                      />
                    </svg>
                  </div>
                  <div className="cup-upload-label">UPLOAD</div>
                </div>
                <div className="cup-thumb cup-thumb-1" aria-label="Asset 1" />
                <div className="cup-thumb cup-thumb-2" aria-label="Asset 2" />
              </div>
            </div>

            <div className="cup-footer">
              <button className="cup-linkbtn" type="button">
                SAVE DRAFT
              </button>

              <div className="cup-toggle-wrap">
                <div className="cup-toggle-label">SCHEDULE POST</div>
                <button
                  className={`cup-toggle ${scheduleEnabled ? "is-on" : "is-off"}`}
                  type="button"
                  onClick={() => setScheduleEnabled((v) => !v)}
                  aria-label="Schedule Post"
                  aria-pressed={scheduleEnabled}
                >
                  <span className="cup-toggle-knob" />
                </button>
              </div>

              <div className="cup-spacer" />

              <div className="cup-when">
                <span className="cup-when-ico" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M7 4.8h10a2.5 2.5 0 0 1 2.5 2.5v10a2.5 2.5 0 0 1-2.5 2.5H7a2.5 2.5 0 0 1-2.5-2.5v-10A2.5 2.5 0 0 1 7 4.8Z"
                      stroke="#16A34A"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8 3.8v2.5M16 3.8v2.5"
                      stroke="#16A34A"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M6.5 9h11"
                      stroke="#16A34A"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span className="cup-when-txt">Oct 24, 2024 • 10:00 AM</span>
              </div>

              <button className="cup-primary" type="button">
                PUBLISH NOW
                <span className="cup-primary-ico" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12h12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M13 6l6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>
            </div>
          </div>

          <div className="cup-right">
            <div className="cup-section-title cup-right-title">OMNI-CHANNEL PREVIEWS</div>

            <div className="cup-preview">
              <div className="cup-prev-head">
               <img
  src="/assets/girl.jpg"
  alt="Avatar"
  className="cup-prev-avatar"
/>
                <div className="cup-prev-meta">
                  <div className="cup-prev-name">GrowMarkt Agency</div>
                  <div className="cup-prev-sub">12,402 followers • promoted</div>
                </div>
              </div>

              <div className="cup-prev-text">
                Maximizing our Q4 velocity with a focus on data-driven content architectures. Our latest metrics
                indicate a 42% lift in organic engagement...
              </div>

              <img
  src="/assets/coffee.png"
  alt="Media Preview"
  className="cup-prev-media"
/>

              <div className="cup-prev-actions" aria-hidden="true">
                <div className="cup-prev-act">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 20.8s-7-3.9-7-10.2A4.2 4.2 0 0 1 9.2 6.4c1.1 0 2.2.5 2.8 1.3.6-.8 1.7-1.3 2.8-1.3A4.2 4.2 0 0 1 19 10.6c0 6.3-7 10.2-7 10.2Z"
                      stroke="#475569"
                      strokeWidth="1.7"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="cup-prev-act">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20 16.8a2 2 0 0 1-2 2H7l-3 2.4V6.8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10Z"
                      stroke="#475569"
                      strokeWidth="1.7"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="cup-prev-act">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4.8 12.4 19.2 5.2l-3.2 15.6-4.6-6.3-6.6-2.1Z"
                      stroke="#475569"
                      strokeWidth="1.7"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="cup-prev-act">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M10 6 18 12l-8 6V6Z"
                      stroke="#475569"
                      strokeWidth="1.7"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="cup-preview cup-preview-mini">
              <div className="cup-mini-row">
                <img
  src="/assets/girl.jpg"
  alt="Mini Avatar"
  className="cup-mini-avatar"
/>
                <div className="cup-mini-name">growmarkt_hq</div>
                <div className="cup-mini-dots" aria-hidden="true">
                  
                  <span />
                  <span />
                  <span />
                </div>
              </div>
              <img
  src="/assets/coffee.png"
  alt="Mini Media"
  className="cup-mini-media"
/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}