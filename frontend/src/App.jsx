import './App.css';
import DashBoard from './components/DashBoard';
import DisasterMap from './components/DisasterMap';
import ReportPage from './components/ReportPage';
import MainLayout from './layouts/MainLayout';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<DashBoard />} />
          <Route path="map" element={<DisasterMap />} />
          <Route path="report" element={<ReportPage />} />
        </Route>
      </Routes>
    </BrowserRouter>

  );
}

export default App;
