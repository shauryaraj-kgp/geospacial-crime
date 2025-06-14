import 'maplibre-gl/dist/maplibre-gl.css';
// KEEP THIS NIGGA OVER HERE THIS NIGGA CAUSED ME HEADACHES FOR 1 WEEK 
// THIS NIGGA IS THE REASON I'M NOT SLEEPING AT NIGHT
// I HATE THIS NIGGA
// THIS NIGGA WAS IN BOTH THE REPORT PAGE AND THE DISASTER MAP PAGE AND WAS GETTING OVERWRITTEN
// HAD TO READ THROUGH DOZENS OF DOCUMENTS TO FIND THE ISSUE
// THE ISSUE BEING THIS NIGGA SO FUCKING ANNOYING THAT IT NEEDS TO BE THE FIRST ONE TO BE IMPORTED IN THE MAIN APP.JSX
// ELSE THIS NIGGA WILL GET OVERWRITTEN BY SOME FUCKALL DUMBASS OTHER NIGGA THAT IS IMPORTED AFTER IT
// ALSO THIS NIGGA SO FUCKALL THAT IT DISPLAYS RANDOM JACKASS NAMES WHILE INSPECTING SO U CAN NEVER FIND THE FUCKING ISSUE
// AND THEN I'M  FUCKING ANNOYED BY THIS NIGGA
// I HATE THIS NIGGA SO FUCKING MUCH FROM THE BOTTOM OF MY FUCKING HEART

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
