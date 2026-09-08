// frontend/src/components/CodeEditor/RepoEditor.jsx
import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { FolderTree, FileCode, X, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '../../App';

export default function RepoEditor({ repoUrl, reportId }) {
  const { token } = useAuth();
  const [files, setFiles] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [fixLoading, setFixLoading] = useState({});
  const [fixedLines, setFixedLines] = useState({});
  const [repoContentLoading, setRepoContentLoading] = useState(false);

  // ── Fetch repo structure ──
  const loadRepo = async () => {
    if (!repoUrl) return;
    setRepoContentLoading(true);
    try {
      const res = await fetch(`/api/github/repo/contents?repoUrl=${encodeURIComponent(repoUrl)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setFiles(data.files || []);
        // Also fetch report to map errors
        if (reportId) {
          const reportRes = await fetch(`/api/report/${reportId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const reportData = await reportRes.json();
          const report = reportData.data?.report || {};
          // Build error map by file path
          const errorMap = {};
          const allErrors = [
            ...(report.bugs || []).map(b => ({ ...b, file: b.file || 'unknown', line: b.line || 1 })),
            ...(report.securityIssues || []).map(s => ({ ...s, file: s.file || 'unknown', line: s.line || 1 })),
          ];
          allErrors.forEach(err => {
            const filePath = err.file || 'unknown';
            if (!errorMap[filePath]) errorMap[filePath] = [];
            errorMap[filePath].push(err);
          });
          setErrors(errorMap);
        }
      }
    } catch (err) {
      console.error('Failed to load repo:', err);
    } finally {
      setRepoContentLoading(false);
    }
  };

  useEffect(() => {
    if (repoUrl) loadRepo();
  }, [repoUrl, reportId]);

  // ── Open a file ──
  const openFile = async (file) => {
    setCurrentFile(file);
    try {
      const res = await fetch(`/api/github/repo/file?repoUrl=${encodeURIComponent(repoUrl)}&filePath=${encodeURIComponent(file.path)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setContent(data.content || '');
      }
    } catch (err) {
      console.error('Failed to load file:', err);
    }
  };

  // ── AI Fix ──
  const handleFix = async (error, lineNumber) => {
    const issueId = error._id || error.id || Date.now();
    setFixLoading(prev => ({ ...prev, [issueId]: true }));

    try {
      const response = await fetch('/api/github/auto-fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          repoUrl,
          filePath: currentFile.path,
          description: error.message || error.issue || error.title || 'Fix issue',
          lineNumber: lineNumber || error.line || 1,
          currentCode: content,
          suggestedFix: error.suggestedFix || error.fix || '',
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert(`✅ Fix PR created! View it here: ${result.prUrl}`);
        window.open(result.prUrl, '_blank');
        // Mark line as fixed
        setFixedLines(prev => ({ ...prev, [lineNumber]: true }));
      } else {
        alert(`❌ Failed to create fix: ${result.error}`);
      }
    } catch (err) {
      console.error('Fix error:', err);
      alert('An error occurred while applying the fix.');
    } finally {
      setFixLoading(prev => ({ ...prev, [issueId]: false }));
    }
  };

  // ── Render file tree ──
  const renderFileTree = (items, level = 0) => {
    if (!items || !items.length) return null;
    return items.map((item) => (
      <div key={item.path} style={{ paddingLeft: `${level * 16}px` }}>
        {item.type === 'dir' ? (
          <details>
            <summary className="flex items-center gap-2 py-1 cursor-pointer hover:bg-[var(--bg-hover)] rounded px-2 text-sm text-[var(--text-secondary)]">
              <FolderTree size={14} />
              {item.name}
            </summary>
            <div>{item.children && renderFileTree(item.children, level + 1)}</div>
          </details>
        ) : (
          <div
            className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer text-sm hover:bg-[var(--bg-hover)] ${
              currentFile?.path === item.path ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-[var(--text-secondary)]'
            }`}
            onClick={() => openFile(item)}
          >
            <FileCode size={14} />
            {item.name}
            {errors[item.path]?.length > 0 && (
              <span className="ml-auto text-xs text-[var(--color-danger)] bg-[var(--color-danger-soft)] px-1.5 py-0.5 rounded">
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
        <span className="text-sm text-[var(--text-muted)]">Loading repository...</span>
      </div>
    );
  }

  return (
    <div className="flex h-[600px] border border-[var(--border-light)] rounded-xl overflow-hidden bg-[var(--bg-primary)]">
      {/* ─── File Tree ───────────────────────────── */}
      <div className="w-64 border-r border-[var(--border-light)] bg-[var(--bg-card)] overflow-y-auto p-2">
        <div className="flex items-center justify-between mb-3 px-2">
          <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Files</span>
          {loading && <span className="text-xs text-[var(--text-muted)]">Loading...</span>}
        </div>
        {files.length > 0 ? (
          renderFileTree(files)
        ) : (
          <div className="text-center py-8 text-sm text-[var(--text-muted)]">No files loaded</div>
        )}
      </div>

      {/* ─── Editor ─────────────────────────────── */}
      <div className="flex-1 flex flex-col">
        {/* File header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-light)] bg-[var(--bg-card)]">
          <span className="text-sm text-[var(--text-secondary)]">
            {currentFile ? currentFile.path : 'Select a file'}
          </span>
          {currentFile && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)]">
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

        {/* Monaco Editor */}
        <div className="flex-1">
          <Editor
            height="100%"
            language="javascript"
            value={content}
            onChange={setContent}
            options={{
              minimap: { enabled: true },
              fontSize: 13,
              theme: 'vs-dark',
              padding: { top: 10 },
              glyphMargin: true,
              automaticLayout: true,
            }}
            onMount={(editor) => {
              // Add error decorations
              if (!currentFile) return;
              const fileErrors = errors[currentFile.path] || [];
              const decorations = fileErrors.map(err => ({
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
                  glyphMarginHoverMessage: { value: err.message || err.issue || '' },
                },
              }));
              editor.deltaDecorations([], decorations);
            }}
          />
        </div>

        {/* Error list & Fix buttons */}
        {currentFile && errors[currentFile.path]?.length > 0 && (
          <div className="border-t border-[var(--border-light)] bg-[var(--bg-card)] max-h-40 overflow-y-auto p-2">
            <div className="text-xs font-medium text-[var(--text-muted)] mb-2">Issues in this file</div>
            {errors[currentFile.path].map((err, idx) => {
              const issueId = err._id || err.id || idx;
              return (
                <div
                  key={idx}
                  className="flex items-start gap-2 py-1.5 px-2 rounded hover:bg-[var(--bg-hover)] border-b border-[var(--border-dark)] last:border-0"
                >
                  <span className="text-[var(--color-danger)] text-xs">⚠</span>
                  <div className="flex-1">
                    <span className="text-xs text-[var(--text-secondary)]">
                      Line {err.line || '?'}: {err.message || err.issue || err.title}
                    </span>
                    {err.suggestion && (
                      <span className="block text-xs text-[var(--text-muted)] mt-0.5">
                        💡 {err.suggestion}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleFix(err, err.line)}
                    disabled={fixLoading[issueId] || fixedLines[err.line]}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition ${
                      fixedLines[err.line]
                        ? 'bg-green-500/20 text-green-400'
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
    </div>
  );
}