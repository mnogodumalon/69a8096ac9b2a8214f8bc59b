import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import VerkaeuferPage from '@/pages/VerkaeuferPage';
import ArtikelPage from '@/pages/ArtikelPage';
import KaeuferPage from '@/pages/KaeuferPage';
import VerkaeufePage from '@/pages/VerkaeufePage';

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="verkaeufer" element={<VerkaeuferPage />} />
          <Route path="artikel" element={<ArtikelPage />} />
          <Route path="kaeufer" element={<KaeuferPage />} />
          <Route path="verkaeufe" element={<VerkaeufePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}