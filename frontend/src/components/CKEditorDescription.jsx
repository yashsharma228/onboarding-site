import React, { useEffect, useRef } from "react";
import {
  ClassicEditor,
  Bold,
  Essentials,
  Italic,
  Underline,
  Strikethrough,
  Paragraph,
  Heading,
  List,
  Link,
  FontColor,
  FontBackgroundColor,
  Alignment,
  BlockQuote,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";

// Global license key definition for CKEditor 5 v42+ GPL open-source usage
if (typeof window !== "undefined") {
  window.CKEDITOR_GLOBAL_LICENSE_KEY = "GPL";
}

const CKEditorDescription = ({
  value,
  onChange,
  placeholder = "Enter comprehensive plan features, description, and benefits...",
}) => {
  const containerRef = useRef(null);
  const editorRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let isCancelled = false;

    // Destroy any existing editor instance
    if (editorRef.current) {
      editorRef.current.destroy().catch((e) => console.warn(e));
      editorRef.current = null;
    }

    const config = {
      licenseKey: "GPL",
      placeholder,
      plugins: [
        Essentials,
        Paragraph,
        Heading,
        Bold,
        Italic,
        Underline,
        Strikethrough,
        FontColor,
        FontBackgroundColor,
        Alignment,
        List,
        Link,
        BlockQuote,
      ],
      toolbar: [
        "heading",
        "|",
        "bold",
        "italic",
        "underline",
        "strikethrough",
        "|",
        "fontColor",
        "fontBackgroundColor",
        "|",
        "bulletedList",
        "numberedList",
        "alignment",
        "|",
        "link",
        "blockQuote",
        "|",
        "undo",
        "redo",
      ],
      heading: {
        options: [
          { model: "paragraph", title: "Paragraph", class: "ck-heading_paragraph" },
          { model: "heading2", view: "h2", title: "Heading 2", class: "ck-heading_heading2" },
          { model: "heading3", view: "h3", title: "Heading 3", class: "ck-heading_heading3" },
        ],
      },
      initialData: value || "",
    };

    ClassicEditor.create(containerRef.current, config)
      .then((editor) => {
        if (isCancelled) {
          editor.destroy();
          return;
        }

        editorRef.current = editor;

        editor.model.document.on("change:data", () => {
          const data = editor.getData();
          if (onChange) {
            onChange(data);
          }
        });
      })
      .catch((err) => {
        console.error("CKEditor initialization error:", err);
      });

    return () => {
      isCancelled = true;
      if (editorRef.current) {
        editorRef.current.destroy().catch((e) => console.warn(e));
        editorRef.current = null;
      }
    };
  }, []);

  return (
    <div className="ckeditor-plan-description rounded-2xl overflow-hidden border border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-2xs">
      <style>{`
        .ckeditor-plan-description .ck-editor__editable_inline {
          min-height: 180px !important;
          max-height: 320px !important;
          overflow-y: auto !important;
          font-family: 'Quicksand', sans-serif;
          font-size: 14px;
          line-height: 1.6;
          padding: 1rem 1.25rem !important;
          background: #ffffff;
        }
        .ckeditor-plan-description .ck.ck-toolbar {
          border-top: 0 !important;
          border-left: 0 !important;
          border-right: 0 !important;
          background: #f8fafc !important;
          padding: 8px 10px !important;
        }
        .ckeditor-plan-description .ck.ck-editor__main > .ck-editor__editable:not(.ck-focused) {
          border-color: transparent !important;
        }
      `}</style>
      <div ref={containerRef} />
    </div>
  );
};

export default CKEditorDescription;
