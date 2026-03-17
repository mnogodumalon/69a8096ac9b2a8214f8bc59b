import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import AdminPage from '@/pages/AdminPage';
import ArtikelPage from '@/pages/ArtikelPage';
import KaeuferPage from '@/pages/KaeuferPage';
import VerkaeuferPage from '@/pages/VerkaeuferPage';
import VerkaeufePage from '@/pages/VerkaeufePage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="artikel" element={<ArtikelPage />} />
          <Route path="kaeufer" element={<KaeuferPage />} />
          <Route path="verkaeufer" element={<VerkaeuferPage />} />
          <Route path="verkaeufe" element={<VerkaeufePage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}