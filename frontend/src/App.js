import './App.css';
import DashBoard from './components/DashBoard';
import DisasterMap from './components/DisasterMap';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import MainLayout from './layouts/MainLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<DashBoard />} />
          <Route path="map" element={<DisasterMap />} />
        </Route>
      </Routes>
    </BrowserRouter>

  );
}

export default App;
