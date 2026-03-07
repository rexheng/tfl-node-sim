import { useStore } from '../store/useStore';
import { LINE_COLOURS } from '../constants';

export default function ConnectionPanel() {
  const phase = useStore((s) => s.phase);
  const candidateEdges = useStore((s) => s.candidateEdges);
  const selectedEdgeKeys = useStore((s) => s.selectedEdgeKeys);
  const stationMap = useStore((s) => s.stationMap);
  const toggleEdge = useStore((s) => s.toggleEdge);
  const commitStation = useStore((s) => s.commitStation);
  const cancelPlacement = useStore((s) => s.cancelPlacement);

  if (phase !== 'connecting') return null;

  // Group by line
  const byLine = new Map<string, typeof candidateEdges>();
  for (const c of candidateEdges) {
    const line = c.edge.line;
    if (!byLine.has(line)) byLine.set(line, []);
    byLine.get(line)!.push(c);
  }

  return (
    <div className="connection-panel">
      <h3>Connect to Lines</h3>
      {Array.from(byLine.entries()).map(([line, edges]) => (
        <div key={line} className="edge-group">
          <div
            className="line-label"
            style={{ color: LINE_COLOURS[line] ?? '#888' }}
          >
            {line.replace(/-/g, ' ')}
          </div>
          {edges.map((c) => {
            const key = `${c.edge.fromId}-${c.edge.toId}-${c.edge.line}`;
            const fromName = stationMap.get(c.edge.fromId)?.name ?? c.edge.fromId;
            const toName = stationMap.get(c.edge.toId)?.name ?? c.edge.toId;
            return (
              <label key={key} className="edge-item">
                <input
                  type="checkbox"
                  checked={selectedEdgeKeys.has(key)}
                  onChange={() => toggleEdge(key)}
                />
                <span className="station-pair">
                  {fromName} — {toName}
                </span>
                <span className="distance">{Math.round(c.distanceM)}m</span>
              </label>
            );
          })}
        </div>
      ))}
      <div className="actions">
        <button className="cancel-btn" onClick={cancelPlacement}>
          Cancel
        </button>
        <button
          className="commit-btn"
          disabled={selectedEdgeKeys.size === 0}
          onClick={commitStation}
        >
          Commit
        </button>
      </div>
    </div>
  );
}
