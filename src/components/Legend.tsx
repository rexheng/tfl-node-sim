import { useStore } from '../store/useStore';

export default function Legend() {
  const phase = useStore((s) => s.phase);

  if (phase !== 'viewing') return null;

  return (
    <div className="legend">
      <h4>Journey Time Impact</h4>
      <div className="gradient-bar" />
      <div className="labels">
        <span>Benefit</span>
        <span>Neutral</span>
        <span>Penalty</span>
      </div>
    </div>
  );
}
