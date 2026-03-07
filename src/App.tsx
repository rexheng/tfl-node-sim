import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { loadStations } from './data/loadStations';
import { loadEdges } from './data/loadEdges';
import { loadLSOA, assignNearestStations } from './data/loadLSOA';
import MapContainer from './map/MapContainer';
import TopBar from './components/TopBar';
import ConnectionPanel from './components/ConnectionPanel';
import MetricsOverlay from './components/MetricsOverlay';
import Legend from './components/Legend';
import Sidebar from './components/Sidebar';
import ComparisonTable from './components/ComparisonTable';

export default function App() {
  const dataLoaded = useStore((s) => s.dataLoaded);
  const toast = useStore((s) => s.toast);
  const initData = useStore((s) => s.initData);

  useEffect(() => {
    async function init() {
      const [stations, edges, lsoa] = await Promise.all([
        loadStations(),
        loadEdges(),
        loadLSOA(),
      ]);
      assignNearestStations(lsoa, stations);
      initData(stations, edges, lsoa);
    }
    init();
  }, [initData]);

  if (!dataLoaded) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading tube network data...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <MapContainer />
      <TopBar />
      <ConnectionPanel />
      <MetricsOverlay />
      <Legend />
      <Sidebar />
      <ComparisonTable />
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
