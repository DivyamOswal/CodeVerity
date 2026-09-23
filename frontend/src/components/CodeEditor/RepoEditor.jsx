// src/components/CodeEditor/RepoEditor.jsx
import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import {
  FolderTree,
  FileCode,
  X,
  Sparkles,
  Loader2,
  Menu,
  AlertTriangle,
  Lightbulb,
  Check,
  ChevronRight,
} from "lucide-react";
import { usePreferences } from "../../context/PreferencesContext";
import { useToast } from "../../hooks/useToast";
import {
  getRepoContents,
  getFileContent,
  autoFixIssue,
} from "../../api/github";
import axios from "../../api/axios";

function registerMonacoTheme(monaco) {
  if (!monaco) return;
  const styles = getComputedStyle(document.documentElement);
  const isLight =
    document.documentElement.getAttribute("data-theme") === "light";

  monaco.editor.defineTheme("codeverity", {
    base: isLight ? "vs" : "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": styles.getPropertyValue("--bg-primary").trim(),
      "editor.foreground": styles.getPropertyValue("--text-primary").trim(),
      "editorLineNumber.foreground": styles
        .getPropertyValue("--text-muted")
        .trim(),
      "editor.gutter.background": styles
        .getPropertyValue("--bg-primary")
        .trim(),
    },
  });
  monaco.editor.setTheme("codeverity");
}

export default function RepoEditor({ repoUrl, reportId }) {
  const { success, error } = useToast();
  const { theme } = usePreferences();

  const [files, setFiles] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState({});
  const [fixLoading, setFixLoading] = useState({});
  const [fixedLines, setFixedLines] = useState({});
  const [repoContentLoading, setRepoContentLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // NEW: per-folder expansion state
  const [expandedFolders, setExpandedFolders] = useState({});
  const [folderContents, setFolderContents] = useState({});
  const [folderLoading, setFolderLoading] = useState({});

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);

  const loadRepo = async () => {
    if (!repoUrl) return;
    setRepoContentLoading(true);
    try {
      const res = await getRepoContents(repoUrl);
      const data = res.data;

      if (!data.success) {
        error(data.error || "Failed to load repository.");
        return;
      }

      setFiles(data.files || []);
      // Reset folder state when repo changes
      setExpandedFolders({});
      setFolderContents({});
      setFolderLoading({});

      if (reportId) {
        const reportRes = await axios.get(`/report/${reportId}`);
        const report = reportRes.data?.report || {};

        const allErrors = [];
        const findings = Array.isArray(report.findings) ? report.findings : [];

        if (findings.length > 0) {
          for (const f of findings) {
            if (!f.file) continue;
            allErrors.push({
              _id: f.id,
              file: f.file,
              line: f.line || 1,
              severity: f.severity,
              category: f.category,
              message: f.title || f.description,
              suggestion: f.suggestedFix,
            });
          }
        } else {
          for (const b of report.bugs || []) {
            allErrors.push({
              ...b,
              file: b.file || "unknown",
              line: b.line || 1,
            });
          }
          for (const s of report.securityIssues || []) {
            allErrors.push({
              ...s,
              file: s.file || "unknown",
              line: s.line || 1,
            });
          }
        }

        const errorMap = {};
        for (const e of allErrors) {
          const filePath = e.file || "unknown";
          if (!errorMap[filePath]) errorMap[filePath] = [];
          errorMap[filePath].push(e);
        }
        setErrors(errorMap);
      }
    } catch (err) {
      console.error("Failed to load repo:", err);
      error("Failed to load repository.");
    } finally {
      setRepoContentLoading(false);
    }
  };

  useEffect(() => {
    if (repoUrl) loadRepo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoUrl, reportId]);

  useEffect(() => {
    if (monacoRef.current) {
      registerMonacoTheme(monacoRef.current);
    }
  }, [theme]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sidebarOpen]);

  /* ─── NEW: toggle a folder and lazy-fetch its contents ─── */
  const toggleFolder = async (folder) => {
    const folderPath = folder.path;
    const willExpand = !expandedFolders[folderPath];

    setExpandedFolders((prev) => ({ ...prev, [folderPath]: willExpand }));

    // Already loaded → nothing to fetch
    if (!willExpand || folderContents[folderPath]) return;

    setFolderLoading((prev) => ({ ...prev, [folderPath]: true }));
    try {
      const res = await getRepoContents(repoUrl, folderPath);
      const data = res.data;
      if (data?.success) {
        setFolderContents((prev) => ({
          ...prev,
          [folderPath]: data.files || [],
        }));
      } else {
        error(data?.error || "Failed to load folder.");
      }
    } catch (err) {
      console.error("Failed to load folder contents:", err);
      error("Failed to load folder contents.");
    } finally {
      setFolderLoading((prev) => ({ ...prev, [folderPath]: false }));
    }
  };

  const openFile = async (file) => {
    setCurrentFile(file);
    setSidebarOpen(false);
    try {
      const res = await getFileContent(repoUrl, file.path);
      const data = res.data;
      if (data.success) {
        setContent(data.content || "");
      } else {
        error(data.error || "Failed to load file.");
      }
    } catch (err) {
      console.error("Failed to load file:", err);
      error("Failed to load file content.");
    }
  };

  const handleFix = async (errObj, lineNumber) => {
    const issueId =
      errObj._id || errObj.id || `${currentFile.path}:${lineNumber}`;
    setFixLoading((prev) => ({ ...prev, [issueId]: true }));

    try {
      const res = await autoFixIssue({
        repoUrl,
        issueId,
        filePath: currentFile.path,
        description:
          errObj.message || errObj.issue || errObj.title || "Fix issue",
        lineNumber: lineNumber || errObj.line || 1,
        currentCode: content,
        suggestedFix: errObj.suggestedFix || errObj.fix || "",
      });
      const result = res.data;

      if (result.success) {
        success(`Fix PR #${result.prNumber} created!`);
        window.open(result.prUrl, "_blank", "noopener,noreferrer");
        setFixedLines((prev) => ({ ...prev, [lineNumber]: true }));
      } else {
        error(result.error || "Failed to create fix PR.");
        if (result.action === "connect_github") {
          error("Please connect your GitHub account in settings.");
        }
      }
    } catch (err) {
      console.error("Fix error:", err);
      const msg =
        err.response?.data?.error || "An error occurred while applying the fix.";
      error(msg);
    } finally {
      setFixLoading((prev) => ({ ...prev, [issueId]: false }));
    }
  };

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const fileErrors = currentFile ? errors[currentFile.path] || [] : [];
    const decorations = fileErrors.map((e) => ({
      range: {
        startLineNumber: e.line || 1,
        endLineNumber: e.line || 1,
        startColumn: 1,
        endColumn: 1,
      },
      options: {
        isWholeLine: true,
        className: "error-line",
        glyphMarginClassName: "error-glyph",
        glyphMarginHoverMessage: {
          value: e.message || e.issue || e.title || "",
        },
      },
    }));

    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current || [],
      decorations,
    );
  }, [currentFile, errors]);

  /* ─── File tree — folders now fetch children on expand ─── */
  const renderFileTree = (items, level = 0) => {
    if (!items || !items.length) return null;

    return items.map((item) => {
      const indent = { paddingLeft: `${level * 16}px` };

      if (item.type === "dir") {
        const isOpen = !!expandedFolders[item.path];
        const children = folderContents[item.path];
        const isLoading = !!folderLoading[item.path];

        return (
          <div key={item.path} style={indent}>
            <button
              type="button"
              onClick={() => toggleFolder(item)}
              aria-expanded={isOpen}
              className="flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1 text-left text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
            >
              <ChevronRight
                size={12}
                className={`shrink-0 transition-transform duration-150 ${
                  isOpen ? "rotate-90" : ""
                }`}
                aria-hidden="true"
              />
              <FolderTree size={14} className="shrink-0" aria-hidden="true" />
              <span className="truncate">{item.name}</span>
              {isLoading && (
                <Loader2
                  size={12}
                  className="ml-auto shrink-0 animate-spin text-[var(--accent)]"
                  aria-hidden="true"
                />
              )}
            </button>

            {isOpen && (
              <div>
                {children && children.length > 0 ? (
                  renderFileTree(children, level + 1)
                ) : !isLoading && children ? (
                  <div
                    className="py-1 text-xs text-[var(--text-muted)]"
                    style={{ paddingLeft: `${(level + 1) * 16 + 24}px` }}
                  >
                    Empty
                  </div>
                ) : null}
              </div>
            )}
          </div>
        );
      }

      return (
        <div key={item.path} style={indent}>
          <button
            type="button"
            onClick={() => openFile(item)}
            aria-current={currentFile?.path === item.path ? "page" : undefined}
            className={`flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1 text-left text-sm transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg-card)] ${
              currentFile?.path === item.path
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : "text-[var(--text-secondary)]"
            }`}
          >
            <FileCode size={14} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{item.name}</span>
            {errors[item.path]?.length > 0 && (
              <span className="ml-auto shrink-0 rounded bg-[var(--color-danger-soft)] px-1.5 py-0.5 text-xs text-[var(--color-danger)]">
                {errors[item.path].length}
              </span>
            )}
          </button>
        </div>
      );
    });
  };

  if (repoContentLoading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-[var(--border-light)] py-12">
        <Loader2
          className="mr-2 animate-spin text-[var(--accent)]"
          size={24}
          aria-hidden="true"
        />
        <span className="text-sm text-[var(--text-muted)]">
          Loading repository...
        </span>
      </div>
    );
  }

  return (
    <div className="relative flex h-[70vh] min-h-[420px] overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--bg-primary)] sm:h-[600px]">
      {sidebarOpen && (
        <div
          className="absolute inset-0 z-30 bg-[var(--bg-primary)]/70 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`absolute inset-y-0 left-0 z-40 w-64 max-w-[80%] overflow-y-auto border-r border-[var(--border-light)] bg-[var(--bg-card)] p-2 transition-transform duration-200 md:relative md:z-0 md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="mb-3 flex items-center justify-between px-2">
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Files
          </span>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 md:hidden"
            aria-label="Close file tree"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
        {files.length > 0 ? (
          renderFileTree(files)
        ) : (
          <div className="py-8 text-center text-sm text-[var(--text-muted)]">
            No files loaded
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-2 border-b border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="shrink-0 rounded-md p-1 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 md:hidden"
              aria-label="Open file tree"
            >
              <Menu size={16} aria-hidden="true" />
            </button>
            <span className="truncate text-xs text-[var(--text-secondary)] sm:text-sm">
              {currentFile ? currentFile.path : "Select a file"}
            </span>
          </div>
          {currentFile && (
            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden text-xs text-[var(--text-muted)] sm:inline">
                {errors[currentFile.path]?.length || 0} issues
              </span>
              <button
                type="button"
                onClick={() => setCurrentFile(null)}
                className="rounded p-1 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
                aria-label="Close file"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1">
          <Editor
            height="100%"
            language="javascript"
            value={content}
            onChange={setContent}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 12,
              padding: { top: 10 },
              glyphMargin: true,
              automaticLayout: true,
              scrollBeyondLastLine: false,
              lineNumbersMinChars: 3,
              wordWrap: "on",
            }}
            onMount={(editor, monaco) => {
              editorRef.current = editor;
              monacoRef.current = monaco;
              registerMonacoTheme(monaco);
            }}
          />
        </div>

        {currentFile && errors[currentFile.path]?.length > 0 && (
          <div className="max-h-40 overflow-y-auto border-t border-[var(--border-light)] bg-[var(--bg-card)] p-2">
            <div className="mb-2 text-xs font-medium text-[var(--text-muted)]">
              Issues in this file
            </div>
            {errors[currentFile.path].map((err, idx) => {
              const issueId = err._id || err.id || idx;
              const isFixed = fixedLines[err.line];
              const isLoading = fixLoading[issueId];

              return (
                <div
                  key={idx}
                  className="flex flex-col gap-2 border-b border-[var(--border-dark)] px-1 py-2 last:border-0 sm:flex-row sm:items-start sm:gap-2 sm:px-2"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-2">
                    <AlertTriangle
                      size={13}
                      strokeWidth={2.2}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-[var(--color-danger)]"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs text-[var(--text-secondary)]">
                        Line {err.line || "?"}:{" "}
                        {err.message || err.issue || err.title}
                      </span>
                      {err.suggestion && (
                        <span className="mt-0.5 flex items-start gap-1.5 text-xs text-[var(--text-muted)]">
                          <Lightbulb
                            size={11}
                            strokeWidth={2}
                            aria-hidden="true"
                            className="mt-0.5 shrink-0 text-[var(--accent)]"
                          />
                          <span>{err.suggestion}</span>
                        </span>
                      )}
                      {err.category && (
                        <span className="mt-1 inline-block rounded border border-[var(--border-light)] bg-[var(--bg-primary)] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                          {err.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFix(err, err.line)}
                    disabled={isLoading || isFixed}
                    aria-label={`${isFixed ? "Fixed" : "Fix"} issue on line ${err.line || "unknown"}`}
                    className={`flex shrink-0 items-center justify-center gap-1 self-start rounded px-2 py-1 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)] sm:self-auto ${
                      isFixed
                        ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
                        : "bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] active:scale-[0.97]"
                    }`}
                  >
                    {isLoading ? (
                      <Loader2
                        className="animate-spin"
                        size={12}
                        aria-hidden="true"
                      />
                    ) : isFixed ? (
                      <Check size={12} strokeWidth={2.6} aria-hidden="true" />
                    ) : (
                      <Sparkles size={12} aria-hidden="true" />
                    )}
                    {isFixed ? "Fixed" : "Fix with AI"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}