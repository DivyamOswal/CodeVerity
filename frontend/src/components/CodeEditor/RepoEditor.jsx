// frontend/src/components/CodeEditor/RepoEditor.jsx
import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import {
  FolderTree,
  FileCode,
  X,
  Sparkles,
  Loader2,
  Menu,
} from "lucide-react";
import { useToast } from "../../hooks/useToast";
import {
  getRepoContents,
  getFileContent,
  autoFixIssue,
} from "../../api/github";
import axios from "../../api/axios";

export default function RepoEditor({ repoUrl, reportId }) {
  const { success, error } = useToast();
  const [files, setFiles] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState({});
  const [fixLoading, setFixLoading] = useState({});
  const [fixedLines, setFixedLines] = useState({});
  const [repoContentLoading, setRepoContentLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Monaco refs — needed to re-apply decorations on file/error changes.
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

      if (reportId) {
        const reportRes = await axios.get(`/report/${reportId}`);
        const report = reportRes.data?.report || {};

        // Prefer the new structured `findings[]` — every item has a real
        // `file` path from the AI prompt rewrite. Fall back to the legacy
        // bugs/securityIssues only if findings is empty.
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
    const issueId = errObj._id || errObj.id || `${currentFile.path}:${lineNumber}`;
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
        success(`✅ Fix PR #${result.prNumber} created!`);
        window.open(result.prUrl, "_blank");
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

  // ─── Apply Monaco decorations whenever file or errors change ───
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

  const renderFileTree = (items, level = 0) => {
    if (!items || !items.length) return null;
    return items.map((item) => (
      <div key={item.path} style={{ paddingLeft: `${level * 16}px` }}>
        {item.type === "dir" ? (
          <details>
            <summary className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">
              <FolderTree size={14} className="shrink-0" />
              <span className="truncate">{item.name}</span>
            </summary>
            <div>
              {item.children && renderFileTree(item.children, level + 1)}
            </div>
          </details>
        ) : (
          <div
            className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-[var(--bg-hover)] ${
              currentFile?.path === item.path
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : "text-[var(--text-secondary)]"
            }`}
            onClick={() => openFile(item)}
          >
            <FileCode size={14} className="shrink-0" />
            <span className="truncate">{item.name}</span>
            {errors[item.path]?.length > 0 && (
              <span className="ml-auto shrink-0 rounded bg-[var(--color-danger-soft)] px-1.5 py-0.5 text-xs text-[var(--color-danger)]">
                {errors[item.path].length}
              </span>
            )}
          </div>
        )}
      </div>
    ));
  };

  if (repoContentLoading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-[var(--border-light)] py-12">
        <Loader2 className="mr-2 animate-spin text-[var(--accent)]" size={24} />
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-md p-1 hover:bg-[var(--bg-hover)] md:hidden"
              aria-label="Close file tree"
            >
              <X size={14} />
            </button>
          </div>
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
              onClick={() => setSidebarOpen(true)}
              className="shrink-0 rounded-md p-1 hover:bg-[var(--bg-hover)] md:hidden"
              aria-label="Open file tree"
            >
              <Menu size={16} />
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
                onClick={() => setCurrentFile(null)}
                className="rounded p-1 hover:bg-[var(--bg-hover)]"
              >
                <X size={14} />
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

              const styles = getComputedStyle(document.documentElement);
              const isLight =
                document.documentElement.getAttribute("data-theme") === "light";
              monaco.editor.defineTheme("codeverity", {
                base: isLight ? "vs" : "vs-dark",
                inherit: true,
                rules: [],
                colors: {
                  "editor.background": styles
                    .getPropertyValue("--bg-primary")
                    .trim(),
                  "editor.foreground": styles
                    .getPropertyValue("--text-primary")
                    .trim(),
                  "editorLineNumber.foreground": styles
                    .getPropertyValue("--text-muted")
                    .trim(),
                  "editorGutter.background": styles
                    .getPropertyValue("--bg-primary")
                    .trim(),
                },
              });
              monaco.editor.setTheme("codeverity");
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
              return (
                <div
                  key={idx}
                  className="flex flex-col gap-2 border-b border-[var(--border-dark)] px-1 py-2 last:border-0 sm:flex-row sm:items-start sm:gap-2 sm:px-2"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-2">
                    <span className="shrink-0 text-xs text-[var(--color-danger)]">
                      ⚠
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs text-[var(--text-secondary)]">
                        Line {err.line || "?"}:{" "}
                        {err.message || err.issue || err.title}
                      </span>
                      {err.suggestion && (
                        <span className="mt-0.5 block text-xs text-[var(--text-muted)]">
                          💡 {err.suggestion}
                        </span>
                      )}
                      {err.category && (
                        <span className="mt-0.5 inline-block rounded border border-[var(--border-light)] bg-[var(--bg-primary)] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-[var(--text-muted)]">
                          {err.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleFix(err, err.line)}
                    disabled={fixLoading[issueId] || fixedLines[err.line]}
                    className={`flex shrink-0 items-center justify-center gap-1 self-start rounded px-2 py-1 text-xs font-medium transition sm:self-auto ${
                      fixedLines[err.line]
                        ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
                        : "bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)]"
                    }`}
                  >
                    {fixLoading[issueId] ? (
                      <Loader2 className="animate-spin" size={12} />
                    ) : (
                      <Sparkles size={12} />
                    )}
                    {fixedLines[err.line] ? "Fixed ✓" : "Fix with AI"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .error-line {
          background: var(--color-danger-soft) !important;
        }
        .error-glyph {
          background: var(--color-danger);
          width: 4px !important;
          margin-left: 3px;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}