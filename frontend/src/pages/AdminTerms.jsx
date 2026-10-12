import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import {
  ClassicEditor,
  Bold,
  Essentials,
  Italic,
  Underline,
  Strikethrough,
  Paragraph,
  Heading,
  FontSize,
  FontColor,
  FontBackgroundColor,
  Alignment,
  List,
  Link,
  Table,
  TableToolbar,
  BlockQuote,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";
import api from "../services/api.js";

// Global license key definition for CKEditor 5 v42+ GPL open-source usage
if (typeof window !== "undefined") {
  window.CKEDITOR_GLOBAL_LICENSE_KEY = "GPL";
}

const AdminTerms = () => {
  const [title, setTitle] = useState("Terms and Conditions");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [activeTab, setActiveTab] = useState("editor"); // 'editor' | 'preview'
  const [lastSaved, setLastSaved] = useState(null);

  const editorContainerRef = useRef(null);
  const editorInstanceRef = useRef(null);

  // Fetch current terms
  const fetchTerms = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/terms");
      if (res.data.success && res.data.data) {
        setTitle(res.data.data.title || "Terms and Conditions");
        const loadedContent = res.data.data.content || "";
        setContent(loadedContent);
        if (res.data.data.updated_at) {
          setLastSaved(new Date(res.data.data.updated_at).toLocaleString());
        }
      }
    } catch (err) {
      console.error("Failed to load terms:", err);
      setFeedback({
        type: "error",
        message: err.response?.data?.message || "Failed to load terms and conditions from database.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerms();
  }, []);

  // Initialize CKEditor on the mounted DOM element once data is loaded
  useEffect(() => {
    if (loading || !editorContainerRef.current) return;

    let isCancelled = false;

    // Destroy any existing editor before creating new
    if (editorInstanceRef.current) {
      editorInstanceRef.current.destroy().catch((e) => console.warn(e));
      editorInstanceRef.current = null;
    }

    const config = {
      licenseKey: "GPL",
      plugins: [
        Essentials,
        Paragraph,
        Heading,
        Bold,
        Italic,
        Underline,
        Strikethrough,
        FontSize,
        FontColor,
        FontBackgroundColor,
        Alignment,
        List,
        Link,
        Table,
        TableToolbar,
        BlockQuote,
      ],
      toolbar: [
        "undo",
        "redo",
        "|",
        "heading",
        "|",
        "fontSize",
        "fontColor",
        "fontBackgroundColor",
        "|",
        "bold",
        "italic",
        "underline",
        "strikethrough",
        "|",
        "alignment",
        "|",
        "bulletedList",
        "numberedList",
        "|",
        "link",
        "blockQuote",
        "insertTable",
      ],
      table: {
        contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"],
      },
      fontSize: {
        options: [9, 11, 13, "default", 17, 19, 21, 24, 28, 32],
        supportAllValues: true,
      },
      heading: {
        options: [
          { model: "paragraph", title: "Paragraph", class: "ck-heading_paragraph" },
          { model: "heading1", view: "h1", title: "Heading 1", class: "ck-heading_heading1" },
          { model: "heading2", view: "h2", title: "Heading 2", class: "ck-heading_heading2" },
          { model: "heading3", view: "h3", title: "Heading 3", class: "ck-heading_heading3" },
        ],
      },
      initialData: content || "",
    };

    ClassicEditor.create(editorContainerRef.current, config)
      .then((editor) => {
        if (isCancelled) {
          editor.destroy();
          return;
        }

        editorInstanceRef.current = editor;

        // Sync editor changes into React content state
        editor.model.document.on("change:data", () => {
          setContent(editor.getData());
        });
      })
      .catch((err) => {
        console.error("CKEditor initialization error:", err);
        setFeedback({
          type: "error",
          message: `CKEditor failed to initialize: ${err.message || err}`,
        });
      });

    return () => {
      isCancelled = true;
      if (editorInstanceRef.current) {
        editorInstanceRef.current.destroy().catch((e) => console.warn(e));
        editorInstanceRef.current = null;
      }
    };
  }, [loading]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const currentHtml = editorInstanceRef.current
      ? editorInstanceRef.current.getData()
      : content;

    try {
      const res = await api.put("/admin/terms", {
        title,
        content: currentHtml,
      });

      if (res.data.success) {
        setFeedback({
          type: "success",
          message: "Terms and conditions saved dynamically to database!",
        });
        if (res.data.data?.updated_at) {
          setLastSaved(new Date(res.data.data.updated_at).toLocaleString());
        }
      } else {
        setFeedback({
          type: "error",
          message: res.data.message || "Failed to save terms.",
        });
      }
    } catch (err) {
      console.error("Failed to save terms:", err);
      setFeedback({
        type: "error",
        message: err.response?.data?.message || "Failed to save terms and conditions.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-['Quicksand']">
      {/* Top Header */}
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Master Terms <span className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 bg-clip-text text-transparent">& Conditions</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
          These standard legal terms are presented to clients during contract acceptance and digital signature verification.
        </p>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl flex items-center justify-between text-sm ${
            feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-3">
            {feedback.type === "success" ? (
              <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-rose-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span className="font-semibold">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            ✕
          </button>
        </motion.div>
      )}

      {/* Main Content Box */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 space-y-6">
        {/* Title Input */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Document Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Terms and Conditions"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-base"
          />
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="py-24 text-center">
            <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-sm font-semibold text-slate-500">Loading terms content...</p>
          </div>
        )}

        {/* Editor Area (always visible) */}
        <div className={loading ? "hidden" : "block"}>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-bold text-slate-700">
              Terms & Conditions Content (Big CKEditor)
            </label>
            {lastSaved && (
              <span className="text-xs text-slate-400">
                Last saved: {lastSaved}
              </span>
            )}
          </div>

          {/* Custom CSS overrides to give CKEditor a generous, expansive height */}
          <div className="ck-content-wrapper rounded-2xl overflow-hidden border border-slate-200 focus-within:border-indigo-500 transition-colors shadow-2xs">
            <style>{`
              .ck-editor__editable_inline {
                min-height: 650px !important;
                height: 650px;
                max-height: 1200px;
                font-family: 'Quicksand', sans-serif;
                font-size: 15px;
                line-height: 1.75;
                padding: 2rem !important;
                background: #ffffff;
              }
              .ck.ck-toolbar {
                border-top: 0 !important;
                border-left: 0 !important;
                border-right: 0 !important;
                background: #f8fafc !important;
                padding: 10px 14px !important;
              }
              .ck.ck-editor__main > .ck-editor__editable:not(.ck-focused) {
                border-color: transparent !important;
              }
            `}</style>
            <div ref={editorContainerRef} />
          </div>
        </div>

        {/* Footer info & Save Button */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-slate-400">
            Changes are stored dynamically in the <code>terms_and_conditions</code> database table.
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 active:scale-95 transition-all shadow-md shadow-purple-600/20 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer text-sm"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminTerms;
