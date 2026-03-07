import { useState } from 'react';
import { useStore } from '../store/useStore';

export default function Sidebar() {
  const scenarios = useStore((s) => s.scenarios);
  const activeScenarioId = useStore((s) => s.activeScenarioId);
  const compareIds = useStore((s) => s.compareIds);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const loadScenario = useStore((s) => s.loadScenario);
  const deleteScenario = useStore((s) => s.deleteScenario);
  const renameScenario = useStore((s) => s.renameScenario);
  const toggleCompare = useStore((s) => s.toggleCompare);
  const setShowComparison = useStore((s) => s.setShowComparison);
  const clearAllScenarios = useStore((s) => s.clearAllScenarios);
  const toggleSidebar = useStore((s) => s.toggleSidebar);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  if (scenarios.length === 0) return null;
  if (!sidebarOpen) {
    return (
      <button
        style={{
          position: 'absolute',
          top: 70,
          left: 16,
          zIndex: 10,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          color: 'var(--text-primary)',
          padding: '6px 12px',
          cursor: 'pointer',
          fontSize: 12,
        }}
        onClick={toggleSidebar}
      >
        History ({scenarios.length})
      </button>
    );
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>Scenario History</h3>
        <button onClick={toggleSidebar}>Hide</button>
      </div>

      <div className="scenario-list">
        {scenarios.map((s) => {
          const isEditing = editingId === s.id;
          return (
            <div
              key={s.id}
              className={`scenario-item ${activeScenarioId === s.id ? 'active' : ''}`}
            >
              <input
                type="checkbox"
                className="compare-check"
                checked={compareIds.has(s.id)}
                onChange={(e) => {
                  e.stopPropagation();
                  toggleCompare(s.id);
                }}
              />
              <div
                className="scenario-info"
                onClick={() => {
                  if (!isEditing) loadScenario(s.id);
                }}
              >
                {isEditing ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => {
                      renameScenario(s.id, editName);
                      setEditingId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        renameScenario(s.id, editName);
                        setEditingId(null);
                      }
                    }}
                    autoFocus
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--accent)',
                      borderRadius: 3,
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      width: '100%',
                      padding: '2px 4px',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div
                    className="scenario-name"
                    onDoubleClick={() => {
                      setEditingId(s.id);
                      setEditName(s.name);
                    }}
                  >
                    {s.name}
                  </div>
                )}
                <div className="scenario-meta">
                  {new Date(s.timestamp).toLocaleTimeString()}
                </div>
              </div>
              <span
                className={`impact-badge ${s.metrics.netTimeImpact < 0 ? 'positive' : 'negative'}`}
              >
                {s.metrics.netTimeImpact < 0 ? '' : '+'}
                {s.metrics.netTimeImpact.toFixed(1)}
              </span>
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteScenario(s.id);
                }}
              >
                x
              </button>
            </div>
          );
        })}
      </div>

      <div className="sidebar-actions">
        <button
          disabled={compareIds.size < 2}
          onClick={() => setShowComparison(true)}
        >
          Compare ({compareIds.size})
        </button>
        <button
          onClick={() => {
            if (confirm('Clear all scenarios?')) clearAllScenarios();
          }}
        >
          Clear All
        </button>
      </div>
    </div>
  );
}
