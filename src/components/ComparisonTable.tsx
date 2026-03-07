import { useStore } from '../store/useStore';

const METRIC_ROWS: { key: keyof ReturnType<typeof getMetricValues>; label: string; lowerIsBetter: boolean }[] = [
  { key: 'netTimeImpact', label: 'Net Time Impact (min)', lowerIsBetter: true },
  { key: 'avgImpact', label: 'Avg Journey Impact (min)', lowerIsBetter: true },
  { key: 'stationsBenefited', label: 'Stations Benefited', lowerIsBetter: false },
  { key: 'stationsPenalised', label: 'Stations Penalised', lowerIsBetter: true },
  { key: 'lsoasBenefited', label: 'LSOAs Benefited', lowerIsBetter: false },
  { key: 'lsoasPenalised', label: 'LSOAs Penalised', lowerIsBetter: true },
  { key: 'maxBenefit', label: 'Max Benefit (min)', lowerIsBetter: false },
  { key: 'maxPenalty', label: 'Max Penalty (min)', lowerIsBetter: true },
];

function getMetricValues(m: { netTimeImpact: number; avgImpact: number; stationsBenefited: number; stationsPenalised: number; lsoasBenefited: number; lsoasPenalised: number; maxBenefit: number; maxPenalty: number }) {
  return m;
}

export default function ComparisonTable() {
  const showComparison = useStore((s) => s.showComparison);
  const compareIds = useStore((s) => s.compareIds);
  const scenarios = useStore((s) => s.scenarios);
  const setShowComparison = useStore((s) => s.setShowComparison);
  const loadScenario = useStore((s) => s.loadScenario);

  if (!showComparison || compareIds.size < 2) return null;

  const selected = scenarios.filter((s) => compareIds.has(s.id));

  return (
    <div className="comparison-overlay" onClick={() => setShowComparison(false)}>
      <div className="comparison-table" onClick={(e) => e.stopPropagation()}>
        <h2>Scenario Comparison</h2>
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Metric</th>
              {selected.map((s) => (
                <th
                  key={s.id}
                  onClick={() => {
                    loadScenario(s.id);
                    setShowComparison(false);
                  }}
                >
                  {s.name}
                  <br />
                  <span className="scenario-loc">
                    {s.lat.toFixed(4)}, {s.lon.toFixed(4)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRIC_ROWS.map((row) => {
              const values = selected.map((s) => s.metrics[row.key]);
              const best = row.lowerIsBetter ? Math.min(...values) : Math.max(...values);
              const worst = row.lowerIsBetter ? Math.max(...values) : Math.min(...values);

              return (
                <tr key={row.key}>
                  <td>{row.label}</td>
                  {selected.map((s, i) => {
                    const v = values[i]!;
                    const isBest = v === best && selected.length >= 2;
                    const isWorst = v === worst && selected.length >= 3;
                    return (
                      <td
                        key={s.id}
                        className={isBest ? 'best' : isWorst ? 'worst' : ''}
                      >
                        {typeof v === 'number' ? v.toFixed(2) : v}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        <button
          style={{
            marginTop: 16,
            padding: '8px 20px',
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
          onClick={() => setShowComparison(false)}
        >
          Close
        </button>
      </div>
    </div>
  );
}
