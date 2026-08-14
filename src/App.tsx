import { Routes, Route } from 'react-router';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Impact from './pages/Impact';
import Feed from './pages/Feed';
import Gallery from './pages/Gallery';
import Admin from './pages/Admin';
import Donate from './pages/Donate';
import DonateSuccess from './pages/DonateSuccess';

export default function App() {
  return (
    <Routes>
      {/* Layout renders <Outlet/> — nested-route pattern (react-dev.md). */}
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="impact" element={<Impact />} />
        <Route path="feed" element={<Feed />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="admin" element={<Admin />} />
        <Route path="donate" element={<Donate />} />
        <Route path="donate/success" element={<DonateSuccess />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}
