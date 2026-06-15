"use client";

/**
 * ScheduleModal — lets users schedule a post to a social media platform.
 *
 * Props:
 *   isOpen      — controls visibility
 *   onClose     — called when modal should close
 *   designId    — the design's _id
 *   imageUrl    — the saved design image URL
 *   platform    — pre-selected platform (can override in dropdown)
 *   userId      — current user ID
 */

import React, { useEffect, useState } from "react";
import PlatformStatusBadge from "./PlatformStatusBadge";

const API_BASE = "http://localhost:3000/api/v1";

const PLATFORMS = [
  { value: "linkedin", label: "LinkedIn", icon: "🔵" },
  { value: "instagram", label: "Instagram", icon: "📸" },
  { value: "facebook", label: "Facebook", icon: "🔷" },
];

interface ConnectedAccount {
  platform: string;
  isActive: boolean;
}

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  designId: string;
  imageUrl: string;
  platform: string;
  userId: string;
}

export default function ScheduleModal({
  isOpen,
  onClose,
  designId,
  imageUrl,
  platform: initialPlatform,
  userId,
}: ScheduleModalProps) {
  const [platform, setPlatform] = useState(initialPlatform || "linkedin");
  const [caption, setCaption] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<
    ConnectedAccount[]
  >([]);

  // Detect user timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Minimum date = today
  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!isOpen || !userId) return;
    const token = localStorage.getItem("token");
    fetch(`${API_BASE}/accounts/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setConnectedAccounts(json.data as ConnectedAccount[]);
      })
      .catch(() => setConnectedAccounts([]));
  }, [isOpen, userId]);

  const isPlatformConnected = connectedAccounts.some(
    (a) => a.platform === platform && a.isActive,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim()) {
      setErrorMsg("Caption is required.");
      return;
    }
    if (!date) {
      setErrorMsg("Please select a date.");
      return;
    }
    if (!time) {
      setErrorMsg("Please select a time.");
      return;
    }
    if (!isPlatformConnected) {
      setErrorMsg(`Connect your ${platform} account first.`);
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const scheduledTime = new Date(`${date}T${time}`).toISOString();
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/scheduler`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          designId,
          platform,
          caption,
          imageUrl,
          headline: "",
          scheduledTime,
          contentId: designId, // best-effort; back-end validates
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        const msg = json.error?.message ?? "Scheduling failed.";
        // If not connected, show link
        if (res.status === 400 && msg.toLowerCase().includes("connect")) {
          setErrorMsg(msg);
        } else {
          setErrorMsg(msg);
        }
        return;
      }

      const scheduledDate = new Date(`${date}T${time}`);
      setSuccessMsg(
        `Post scheduled for ${scheduledDate.toLocaleDateString()} at ${scheduledDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      );
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 2500);
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Schedule Post</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            ✅ {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Platform selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.icon} {p.label}
                </option>
              ))}
            </select>
            <div className="mt-1">
              <PlatformStatusBadge
                platform={platform as "linkedin" | "instagram" | "facebook"}
                userId={userId}
              />
            </div>
            {!isPlatformConnected && (
              <p className="text-xs text-yellow-600 mt-1">
                ⚠️ Connect your account to schedule.{" "}
                <a
                  href="/settings/accounts"
                  className="underline text-blue-600"
                >
                  Go to connections →
                </a>
              </p>
            )}
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write your post caption…"
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              min={todayStr}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Scheduling in: {timezone}
            </p>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {errorMsg}
              {errorMsg.toLowerCase().includes("connect") && (
                <span>
                  {" "}
                  <a href="/settings/accounts" className="underline">
                    Connect now →
                  </a>
                </span>
              )}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !isPlatformConnected}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition"
          >
            {submitting ? "Scheduling…" : "Schedule Post"}
          </button>
        </form>
      </div>
    </div>
  );
}
