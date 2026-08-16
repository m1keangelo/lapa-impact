import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router';
import Layout from './components/Layout';
import Home from './pages/Home';

/* Route-level code splitting (PERFORMANCE §44): visitors landing on the
   homepage should not download the admin panel, the auth flow, or the
   heavier secondary pages. Each route loads its own chunk on demand. */
const Login = lazy(() => import('./pages/Login'));
const Impact = lazy(() => import('./pages/Impact'));
const Feed = lazy(() => import('./pages/Feed'));
const Gallery = lazy(() => import('./pages/Gallery'));
const Admin = lazy(() => import('./pages/Admin'));
const Donate = lazy(() => import('./pages/Donate'));
const DonateSuccess = lazy(() => import('./pages/DonateSuccess'));
const Event = lazy(() => import('./pages/Event'));

export default function App() {
  return (
    <Routes>
      {/* Layout renders <Outlet/> — nested-route pattern (react-dev.md). */}
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Suspense fallback={null}><Login /></Suspense>} />
        <Route path="impact" element={<Suspense fallback={null}><Impact /></Suspense>} />
        <Route path="feed" element={<Suspense fallback={null}><Feed /></Suspense>} />
        <Route path="event" element={<Suspense fallback={null}><Event /></Suspense>} />
        <Route path="gallery" element={<Suspense fallback={null}><Gallery /></Suspense>} />
        <Route path="admin" element={<Suspense fallback={null}><Admin /></Suspense>} />
        <Route path="donate" element={<Suspense fallback={null}><Donate /></Suspense>} />
        <Route path="donate/success" element={<Suspense fallback={null}><DonateSuccess /></Suspense>} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}
