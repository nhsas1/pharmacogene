import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import { ErrorState, LoadingState } from './components/Primitives';
import { emptyDataset, loadDataset } from './lib/api';
import Dashboard from './pages/Dashboard';
import { DrugDetail, DrugsPage, GeneDetail, GenesPage } from './pages/ExplorerPages';
import { InteractionDetail, InteractionsPage } from './pages/InteractionsPage';
import { ReferenceDetail, ReferencesPage } from './pages/ReferencesPage';
import { AdminGuard, AdminLogin, AdminPage } from './pages/AdminPages';

const DatasetContext = createContext(null);

export function useDataset() {
  return useContext(DatasetContext);
}

function DatasetProvider({ children }) {
  const [dataset, setDataset] = useState(emptyDataset);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  const refresh = async () => {
    setStatus('loading');
    setError('');
    try {
      setDataset(await loadDataset());
      setStatus('ready');
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Unable to connect to the Supabase database.');
    }
  };

  useEffect(() => { refresh(); }, []);
  const value = useMemo(() => ({ dataset, status, error, refresh }), [dataset, status, error]);
  return <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>;
}

function RouteGate({ children }) {
  const { status, error, refresh } = useDataset();
  const location = useLocation();
  if (location.pathname === '/admin/login') return children;
  if (status === 'loading') return <LoadingState />;
  if (status === 'error') return <ErrorState message={error} onRetry={refresh} />;
  return children;
}

export default function App() {
  return <DatasetProvider><Routes>
    <Route path="/admin/login" element={<AdminLogin />} />
    <Route element={<Layout />}>
      <Route element={<RouteGate />}>
        <Route index element={<Dashboard />} />
        <Route path="drugs" element={<DrugsPage />} />
        <Route path="drugs/:id" element={<DrugDetail />} />
        <Route path="genes" element={<GenesPage />} />
        <Route path="genes/:id" element={<GeneDetail />} />
        <Route path="interactions" element={<InteractionsPage />} />
        <Route path="interactions/:id" element={<InteractionDetail />} />
        <Route path="references" element={<ReferencesPage />} />
        <Route path="references/:id" element={<ReferenceDetail />} />
        <Route path="admin" element={<AdminGuard><AdminPage /></AdminGuard>} />
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></DatasetProvider>;
}
