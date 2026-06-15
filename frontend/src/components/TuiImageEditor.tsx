"use client";

import React, { useEffect, useRef, useState } from "react";
import "tui-image-editor/dist/tui-image-editor.css";

interface TuiImageEditorProps {
  imageUrl: string;
  onSave: (base64: string) => void;
  onBack: () => void;
  saving?: boolean;
}

export default function TuiImageEditor({ imageUrl, onSave, onBack, saving = false }: TuiImageEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    // Load TUI Image Editor dynamically to avoid Next.js build errors (WorkerError)
    const initEditor = async () => {
      try {
        const TuiEditor = (await import("tui-image-editor")).default;
        
        const editor = new TuiEditor(containerRef.current as HTMLElement, {
      includeUI: {
        loadImage: {
          path: imageUrl,
          name: "GeneratedImage",
        },
        theme: {
          'common.bi.image': '',
          'common.bisize.width': '0px',
          'common.bisize.height': '0px',
          'common.backgroundImage': '#fff',
          'common.backgroundColor': '#fff',
          'common.border': '1px solid #e2e8f0',

          // header
          'header.backgroundImage': 'none',
          'header.backgroundColor': 'transparent',
          'header.border': '0px',

          // load button
          'loadButton.backgroundColor': '#fff',
          'loadButton.border': '1px solid #ddd',
          'loadButton.color': '#222',
          'loadButton.fontFamily': 'Inter, sans-serif',
          'loadButton.fontSize': '12px',

          // download button
          'downloadButton.backgroundColor': '#4f46e5',
          'downloadButton.border': '1px solid #4f46e5',
          'downloadButton.color': '#fff',
          'downloadButton.fontFamily': 'Inter, sans-serif',
          'downloadButton.fontSize': '12px',

          // main icons
          'menu.normalIcon.color': '#8a8a8a',
          'menu.activeIcon.color': '#555555',
          'menu.disabledIcon.color': '#434343',
          'menu.hoverIcon.color': '#e9e9e9',
          'menu.iconSize.width': '24px',
          'menu.iconSize.height': '24px',

          // submenu icons
          'submenu.normalIcon.color': '#8a8a8a',
          'submenu.activeIcon.color': '#555555',
          'submenu.iconSize.width': '32px',
          'submenu.iconSize.height': '32px',

          // submenu primary color
          'submenu.backgroundColor': 'transparent',
          'submenu.partition.color': '#e5e5e5',

          // submenu labels
          'submenu.normalLabel.color': '#858585',
          'submenu.normalLabel.fontWeight': 'normal',
          'submenu.activeLabel.color': '#000',
          'submenu.activeLabel.fontWeight': 'normal',

          // checkbox style
          'checkbox.border': '1px solid #ccc',
          'checkbox.backgroundColor': '#fff',

          // rango style
          'range.pointer.color': '#333',
          'range.bar.color': '#ccc',
          'range.subbar.color': '#606060',

          'range.disabledPointer.color': '#d3d3d3',
          'range.disabledBar.color': 'rgba(85,85,85,0.06)',
          'range.disabledSubbar.color': 'rgba(51,51,51,0.2)',

          'range.value.color': '#000',
          'range.value.fontWeight': 'normal',
          'range.value.fontSize': '11px',
          'range.value.border': '0',
          'range.value.backgroundColor': '#f5f5f5',

          'title.default.color': '#555',
          'title.default.fontSize': '12px',
          'title.default.fontWeight': 'bold',
          'title.active.color': '#222',
          'title.active.fontSize': '12px',
          'title.active.fontWeight': 'bold'
        },
        menu: [
          "crop",
          "flip",
          "rotate",
          "draw",
          "shape",
          "icon",
          "text",
          "filter",
        ],
        initMenu: "filter",
        uiSize: {
          width: "100%",
          height: "800px",
        },
        menuBarPosition: "bottom",
      },
      cssMaxWidth: 2000,
      cssMaxHeight: 1200,
      selectionStyle: {
        cornerSize: 20,
        rotatingPointOffset: 70,
      }
    });

    editorInstanceRef.current = editor as any;

      // Remove loading state once initialized
      setTimeout(() => setLoading(false), 500);
      } catch (err) {
        console.error("Failed to load TUI Editor", err);
        setLoading(false);
      }
    };

    initEditor();

    return () => {
      if (editorInstanceRef.current) {
        editorInstanceRef.current.destroy();
      }
    };
  }, [imageUrl]);

  const handleSave = () => {
    if (editorInstanceRef.current) {
      // Get the edited image as a base64 string
      const dataUrl = editorInstanceRef.current.toDataURL();
      onSave(dataUrl);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-800">
        <button
          onClick={onBack}
          disabled={saving}
          className="btn-secondary text-sm px-4 py-2"
        >
          ← Back
        </button>
        <h2 className="text-base font-semibold text-slate-200">Edit Your Design</h2>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="btn-primary text-sm px-6 py-2"
        >
          {saving ? (
            <>
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving…
            </>
          ) : "Save Image"}
        </button>
      </div>

      <div className="relative border border-slate-800 rounded-xl overflow-hidden shadow-xl bg-slate-900 min-h-[800px] flex items-center justify-center">
        {loading && (
          <div className="absolute inset-0 z-10 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-brand-400 font-medium text-sm animate-pulse">Loading Editor…</p>
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" style={{ minHeight: "800px" }} />
      </div>
    </div>
  );
}
