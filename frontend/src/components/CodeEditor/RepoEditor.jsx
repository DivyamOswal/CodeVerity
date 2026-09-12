// frontend/src/components/CodeEditor/RepoEditor.jsx
import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { FolderTree, FileCode, X, Sparkles, Loader2, Menu } from 'lucide-react';
import { useAuth } from '../../App';
import { useToast } from '../../hooks/useToast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function RepoEditor({ repoUrl, reportId }) {
  const { token } = useAuth();
  const { success, error } = useToast();
  const [files, setFiles] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [fixLoading, setFixLoading] = useState({});
  const [fixedLines, setFixedLines] = useState({});
  const [repoContentLoading, setRepoContentLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadRepo = async () => {
    if (!repoUrl) return;
    setRepoContentLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/github/repo/contents?repoUrl=${encodeURIComponent(repoUrl)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (data.success) {
        setFiles(data.files || []);
        if (reportId) {
          const reportRes = await fetch(`${API_URL}/report/${reportId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const reportData = await reportRes.json();
          const report = reportData.data?.report || reportData.report || {};
          const errorMap = {};
          const allErrors = [
            ...(report.bugs || []).map((b) => ({
              ...b,
              file: b.file || 'unknown',
              line: b.line || 1,
            })),
            ...(report.securityIssues || []).map((s) => ({
              ...s,
              file: s.file || 'unknown',
              line: s.line || 1,
            })),
          ];
          allErrors.forEach((err) => {
            const filePath = err.file || 'unknown';
            if (!errorMap[filePath]) errorMap[filePath] = [];
            errorMap[filePath].push(err);
          });
          setErrors(errorMap);
        }
      } else {
        error(data.error || 'Failed to load repository.');
      }
    } catch (err) {
      console.error('Failed to load repo:', err);
      error('Failed to load repository.');
    } finally {
      setRepoContentLoading(false);
    }
  };

  useEffect(() => {
    if (repoUrl) loadRepo();
  }, [repoUrl, reportId]);

  const openFile = async (file) => {
    setCurrentFile(file);
    setSidebarOpen(false);
    try {
      const res = await fetch(
        `${API_URL}/github/repo/file?repoUrl=${encodeURIComponent(repoUrl)}&filePath=${encodeURIComponent(file.path)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (data.success) {
        setContent(data.content || '');
      } else {
        error(data.error || 'Failed to load file.');
      }
    } catch (err) {
      console.error('Failed to load file:', err);
      error('Failed to load file content.');
    }
  };

  const handleFix = async (errObj, lineNumber) => {
    const issueId = errObj._id || errObj.id || Date.now();
    setFixLoading((prev) => ({ ...prev, [issueId]: true }));

    try {
      const response = await fetch(`${API_URL}/github/auto-fix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          repoUrl,
          filePath: currentFile.path,
          description:
            errObj.message || errObj.issue || errObj.title || 'Fix issue',
          lineNumber: lineNumber || errObj.line || 1,
          currentCode: content,
          suggestedFix: errObj.suggestedFix || errObj.fix || '',
        }),
      });

      const result = await response.json();
      if (result.success) {
        success(`✅ Fix PR #${result.prNumber} created!`);
        window.open(result.prUrl, '_blank');
        setFixedLines((prev) => ({ ...prev, [lineNumber]: true }));
      } else {
        error(result.error || 'Failed to create fix PR.');
        if (result.action === 'connect_github') {
          error('Please connect your GitHub account in settings.');
        }
      }
    } catch (err) {
      console.error('Fix error:', err);
      error('An error occurred while applying the fix.');
    } finally {
      setFixLoading((prev) => ({ ...prev, [issueId]: false }));
    }
  };

  const renderFileTree = (items, level = 0) => {
    if (!items || !items.length) return null;
    return items.map((item) => (
      <div key={item.path} style={{ paddingLeft: `${level * 16}px` }}>
        {item.type === 'dir' ? (
          <details>
            <summary className="flex items-center gap-2 py-1 cursor-pointer hover:bg-[var(--bg-hover)] rounded px-2 text-sm text-[var(--text-secondary)]">
              <FolderTree size={14} className="shrink-0" />
              <span className="truncate">{item.name}</span>
            </summary>
            <div>
              {item.children && renderFileTree(item.children, level + 1)}
            </div>
          </details>
        ) : (
          <div
            className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer text-sm hover:bg-[var(--bg-hover)] ${
              currentFile?.path === item.path
                ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'text-[var(--text-secondary)]'
            }`}
            onClick={() => openFile(item)}
          >
            <FileCode size={14} className="shrink-0" />
            <span className="truncate">{item.name}</span>
            {errors[item.path]?.length > 0 && (
              <span className="ml-auto shrink-0 text-xs text-[var(--color-danger)] bg-[var(--color-danger-soft)] px-1.5 py-0.5 rounded">
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
      <div className="flex items-center justify-center py-12 border border-[var(--border-light)] rounded-xl">
        <Loader2 className="animate-spin text-[var(--accent)] mr-2" size={24} />
        <span className="text-sm text-[var(--text-muted)]">
          Loading repository...
        </span>
      </div>
    );
  }

  return (
    <div className="relative flex h-[70vh] min-h-[420px] border border-[var(--border-light)] rounded-xl overflow-hidden bg-[var(--bg-primary)] sm:h-[600px]">
      {sidebarOpen && (
        <div
          className="absolute inset-0 z-30 bg-[var(--bg-primary)]/70 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`absolute inset-y-0 left-0 z-40 w-64 max-w-[80%] border-r border-[var(--border-light)] bg-[var(--bg-card)] overflow-y-auto p-2 transition-transform duration-200 md:relative md:z-0 md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between mb-3 px-2">
          <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            Files
          </span>
          <div className="flex items-center gap-2">
            {loading && (
              <span className="text-xs text-[var(--text-muted)]">
                Loading...
              </span>
            )}
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
          <div className="text-center py-8 text-sm text-[var(--text-muted)]">
            No files loaded
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[var(--border-light)] bg-[var(--bg-card)] sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="shrink-0 rounded-md p-1 hover:bg-[var(--bg-hover)] md:hidden"
              aria-label="Open file tree"
            >
              <Menu size={16} />
            </button>
            <span className="truncate text-xs text-[var(--text-secondary)] sm:text-sm">
              {currentFile ? currentFile.path : 'Select a file'}
            </span>
          </div>
          {currentFile && (
            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden text-xs text-[var(--text-muted)] sm:inline">
                {errors[currentFile.path]?.length || 0} issues
              </span>
              <button
                onClick={() => setCurrentFile(null)}
                className="p-1 rounded hover:bg-[var(--bg-hover)]"
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
              wordWrap: 'on',
            }}
            onMount={(editor, monaco) => {
              // Build a Monaco theme from the app's real CSS variable
              // values (read once via getComputedStyle, since Monaco
              // — like <canvas> — can't consume CSS custom properties
              // directly). Falls back to vs-dark on first paint via the
              // `theme` prop above; this overrides it once mounted so
              // the editor follows the app's active light/dark theme
              // instead of always forcing dark mode.
              const styles = getComputedStyle(document.documentElement);
              const isLight = document.documentElement.getAttribute('data-theme') === 'light';
              monaco.editor.defineTheme('codeverity', {
                base: isLight ? 'vs' : 'vs-dark',
                inherit: true,
                rules: [],
                colors: {
                  'editor.background': styles.getPropertyValue('--bg-primary').trim(),
                  'editor.foreground': styles.getPropertyValue('--text-primary').trim(),
                  'editorLineNumber.foreground': styles.getPropertyValue('--text-muted').trim(),
                  'editorGutter.background': styles.getPropertyValue('--bg-primary').trim(),
                },
              });
              monaco.editor.setTheme('codeverity');

              if (!currentFile) return;
              const fileErrors = errors[currentFile.path] || [];
              const decorations = fileErrors.map((err) => ({
                range: {
                  startLineNumber: err.line || 1,
                  endLineNumber: err.line || 1,
                  startColumn: 1,
                  endColumn: 1,
                },
                options: {
                  isWholeLine: true,
                  className: 'error-line',
                  glyphMarginClassName: 'error-glyph',
                  glyphMarginHoverMessage: {
                    value: err.message || err.issue || '',
                  },
                },
              }));
              editor.deltaDecorations([], decorations);
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
                  className="flex flex-col gap-2 border-b border-[var(--border-dark)] py-2 px-1 last:border-0 sm:flex-row sm:items-start sm:gap-2 sm:px-2"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-2">
                    <span className="shrink-0 text-[var(--color-danger)] text-xs">
                      ⚠
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs text-[var(--text-secondary)]">
                        Line {err.line || '?'}:{' '}
                        {err.message || err.issue || err.title}
                      </span>
                      {err.suggestion && (
                        <span className="mt-0.5 block text-xs text-[var(--text-muted)]">
                          💡 {err.suggestion}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleFix(err, err.line)}
                    disabled={fixLoading[issueId] || fixedLines[err.line]}
                    className={`flex shrink-0 items-center justify-center gap-1 self-start rounded px-2 py-1 text-xs font-medium transition sm:self-auto ${
                      fixedLines[err.line]
                        ? 'bg-[var(--color-success-soft)] text-[var(--color-success)]'
                        : 'bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)]'
                    }`}
                  >
                    {fixLoading[issueId] ? (
                      <Loader2 className="animate-spin" size={12} />
                    ) : (
                      <Sparkles size={12} />
                    )}
                    {fixedLines[err.line] ? 'Fixed ✓' : 'Fix with AI'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Monaco decoration CSS. These classNames are applied by
          editor.deltaDecorations above but Monaco doesn't generate any
          styling for them itself — without this block, error lines and
          glyph markers render but are invisible. */}
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