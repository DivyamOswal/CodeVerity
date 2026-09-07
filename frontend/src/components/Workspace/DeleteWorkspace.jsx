import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteWorkspace } from "../../api/workspace";
import { useToast } from "../../hooks/useToast";

export default function DeleteWorkspace() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { success, error } = useToast();

  const handleDelete = async () => {
    if (!window.confirm("Delete this workspace? This will remove all members and data. It can be restored within 30 days.")) return;
    setLoading(true);
    try {
      await deleteWorkspace();
      success("Workspace deleted. It will be permanently removed in 30 days.");
      navigate("/dashboard");
    } catch (err) {
      error(err.response?.data?.error || "Failed to delete workspace");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 border-t border-red-500/20 pt-6">
      <h4 className="text-sm font-semibold text-red-400">Danger Zone</h4>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 disabled:opacity-50"
      >
        {loading ? "Deleting..." : "Delete Workspace"}
      </button>
    </div>
  );
}