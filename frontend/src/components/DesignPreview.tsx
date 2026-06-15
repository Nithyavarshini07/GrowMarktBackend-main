"use client";

/**
 * DesignPreview — shows a saved/generated design with action buttons.
 *
 * Props:
 *   designId    — the design's MongoDB _id (used as postId for save)
 *   platform    — 'linkedin' | 'instagram' | 'facebook'
 *   day         — e.g. "Monday"
 *   imageUrl    — URL of the design image to preview
 *   headline    — the post headline (for display)
 *   onEdit      — called when user clicks "Edit Design"
 *   onSchedule  — called when user clicks "Schedule Post"
 */

import React, { useState } from "react";

const PLATFORM_ICONS: Record<string, string> = {
  linkedin: "🔵",
  instagram: "📸",
  facebook: "🔷",
};

interface DesignPreviewProps {
  designId: string;
  platform: string;
  day: string;
  imageUrl: string;
  headline: string;
  onEdit: (imageUrl: string) => void;
  onSchedule: (designId: string, imageUrl: string, platform: string) => void;
}

export default function DesignPreview({
  designId,
  platform,
  day,
  imageUrl,
  headline,
  onEdit,
  onSchedule,
}: DesignPreviewProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `design-${designId}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <span className="text-lg">{PLATFORM_ICONS[platform] ?? "📱"}</span>
        <span className="font-semibold text-gray-800 capitalize">
          {platform}
        </span>
        <span className="ml-auto text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
          {day}
        </span>
      </div>

      {/* Design image */}
      <div className="relative w-full aspect-square bg-gray-50">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={headline}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No design yet
          </div>
        )}
      </div>

      {/* Headline */}
      <div className="px-4 py-2 border-b border-gray-50">
        <p className="text-sm text-gray-600 line-clamp-2">{headline}</p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 px-4 py-3">
        <button
          onClick={() => onEdit(imageUrl)}
          className="flex-1 text-xs px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
        >
          ✏️ Edit Design
        </button>

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex-1 text-xs px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition disabled:opacity-50"
        >
          {downloading ? "…" : "⬇️ Download"}
        </button>

        <button
          onClick={() => onSchedule(designId, imageUrl, platform)}
          className="flex-1 text-xs px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          🗓️ Schedule
        </button>
      </div>
    </div>
  );
}
