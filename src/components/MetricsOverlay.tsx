import { useStore } from '../store/useStore';

export default function MetricsOverlay() {
  const metrics = useStore((s) => s.currentMetrics);
  const phase = useStore((s) => s.phase);

  if (phase !== 'viewing' || !metrics) return null;

  const fmt = (v: number) => (v >= 0 ? '+' : '') + v.toFixed(2);
  const cls = (v: number) => (v < -0.001 ? 'positive' : v > 0.001 ? 'negative' : '');

  return (
    <div className="metrics-overlay">
      <h3>Impact Metrics</h3>
      <div className="metric-row">
        <span className="label">Net Time Impact</span>
        <span className={`value ${cls(metrics.netTimeImpact)}`}>
          {fmt(metrics.netTimeImpact)} min
        </span>
      </div>
      <div className="metric-row">
        <span className="label">Avg Journey Impact</span>
        <span className={`value ${cls(metrics.avgImpact)}`}>
          {fmt(metrics.avgImpact)} min
        </span>
      </div>
      <div className="metric-row">
        <span className="label">Stations Benefited</span>
        <span className="value positive">{metrics.stationsBenefited}</span>
      </div>
      <div className="metric-row">
        <span className="label">Stations Penalised</span>
        <span className="value negative">{metrics.stationsPenalised}</span>
      </div>
      <div className="metric-row">
        <span className="label">LSOAs Benefited</span>
        <span className="value positive">{metrics.lsoasBenefited}</span>
      </div>
      <div className="metric-row">
        <span className="label">LSOAs Penalised</span>
        <span className="value negative">{metrics.lsoasPenalised}</span>
      </div>
      <div className="metric-row">
        <span className="label">Max Benefit</span>
        <span className="value positive">-{metrics.maxBenefit.toFixed(2)} min</span>
      </div>
      <div className="metric-row">
        <span className="label">Max Penalty</span>
        <span className="value negative">+{metrics.maxPenalty.toFixed(2)} min</span>
      </div>
    </div>
  );
}
