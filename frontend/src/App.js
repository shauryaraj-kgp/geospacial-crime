import './App.css';
import DashBoard from './components/DashBoard';
import MapPage from './components/MapPage';
import 'leaflet/dist/leaflet.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/map' element={<MapPage />} />
        <Route path='/' element={<DashBoard />} />
      </Routes>
    </Router>
  );
}

export default App;
