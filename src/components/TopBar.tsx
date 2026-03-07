import { useStore } from '../store/useStore';

export default function TopBar() {
  const phase = useStore((s) => s.phase);
  const startPlacing = useStore((s) => s.startPlacing);
  const reset = useStore((s) => s.reset);
  const saveScenario = useStore((s) => s.saveScenario);

  return (
    <div className="top-bar">
      <button
        className={phase === 'placing' ? 'active' : ''}
        onClick={startPlacing}
        disabled={phase !== 'idle'}
      >
        Place Station
      </button>
      {phase === 'viewing' && (
        <button onClick={() => saveScenario()}>Save Scenario</button>
      )}
      <button
        onClick={reset}
        disabled={phase === 'idle' || phase === 'computing'}
      >
        Reset
      </button>
      {phase === 'computing' && (
        <span style={{ color: '#00d4ff', fontSize: 13 }}>Computing...</span>
      )}
    </div>
  );
}
