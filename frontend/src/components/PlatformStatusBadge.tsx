"use client";

/**
 * PlatformStatusBadge — shows connection status for a social media platform.
 *
 * Props:
 *   platform  — 'linkedin' | 'instagram' | 'facebook'
 *   userId    — current user ID
 *
 * States:
 *   ✅ green  — connected
 *   ⚠️ yellow — token expired
 *   ❌ grey   — not connected
 */

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = "http://localhost:3000/api/v1";

interface ConnectedAccount {
  platform: string;
  accountName: string;
  isActive: boolean;
  tokenExpiresAt?: string;
}

interface PlatformStatusBadgeProps {
  platform: "linkedin" | "instagram" | "facebook";
  userId: string;
}

export default function PlatformStatusBadge({
  platform,
  userId,
}: PlatformStatusBadgeProps) {
  const router = useRouter();
  const [account, setAccount] = useState<ConnectedAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const token = localStorage.getItem("token");

    fetch(`${API_BASE}/accounts/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          const found = (json.data as ConnectedAccount[]).find(
            (a) => a.platform === platform && a.isActive,
          );
          setAccount(found ?? null);
        }
      })
      .catch(() => setAccount(null))
      .finally(() => setLoading(false));
  }, [platform, userId]);

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
        <span className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
        Loading…
      </span>
    );
  }

  const isExpired =
    account?.tokenExpiresAt && new Date(account.tokenExpiresAt) < new Date();

  if (!account || isExpired) {
    return (
      <button
        onClick={() => router.push("/settings/accounts")}
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition"
        title="Click to connect"
      >
        <span
          className={`w-2 h-2 rounded-full ${isExpired ? "bg-yellow-400" : "bg-gray-400"}`}
        />
        {isExpired ? "⚠️ Reconnect" : "❌ Not connected"}
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-green-600">
      <span className="w-2 h-2 rounded-full bg-green-500" />✅{" "}
      {account.accountName || "Connected"}
    </span>
  );
}
