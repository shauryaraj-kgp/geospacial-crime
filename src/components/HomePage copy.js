// import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
// import { GeoJSON } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css';
// import L from 'leaflet';
// import '../styles/HomePage.css';
// import { useState } from 'react';
// import regionalData from '../data/final_df.json'
// import geoData from '../data/Counties_and_Unitary_Authorities_December_2024_Boundaries_UK_BFE_-1559183835153833632.json'

// // Optional: Fix for default marker icon issue in Leaflet + React
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//     iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
//     iconUrl: require('leaflet/dist/images/marker-icon.png'),
//     shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
// });

// function HomePage() {

//     // const [scoreType, setScoreType] = useState('crimeScore');
//     const [selectedYear, setSelectedYear] = useState(2024);
//     const [selectedMonth, setSelectedMonth] = useState(12);

//     // const redIcon = new L.Icon({
//     //     iconUrl: require('../assets/marker-icon-red.png'), // custom red marker
//     //     shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
//     //     iconSize: [25, 41],
//     //     iconAnchor: [12, 41],
//     //     popupAnchor: [1, -34],
//     //     shadowSize: [41, 41]
//     // });

//     // const greenIcon = new L.Icon({
//     //     iconUrl: require('../assets/marker-icon-green.png'), // custom green marker
//     //     shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
//     //     iconSize: [25, 41],
//     //     iconAnchor: [12, 41],
//     //     popupAnchor: [1, -34],
//     //     shadowSize: [41, 41]
//     // });


//     // Step 1: Create a map from region names to scores
//     const regionalScoreMap = {};

//     if (Array.isArray(regionalData)) {
//         regionalData.forEach(entry => {
//             const location = entry.source_location?.trim();
//             const year = Number(entry.year);
//             const month = Number(entry.month);

//             if (location && year === Number(selectedYear) && month === Number(selectedMonth)) {
//                 const score = parseFloat(entry['DETECTED CRIME']);
//                 if (!isNaN(score)) {
//                     regionalScoreMap[location] = score;
//                 }
//             }
//         });
//     }

//     // Step 2: Lookup score by region name (case-insensitive, trimmed)
//     const getRegionScore = (regionName) => {
//         const name = regionName?.trim();
//         return regionalScoreMap[name] ?? null;
//     };

//     // Step 3: Generate color from 0 (green) to 780 (red)
//     const getColor = (score) => {
//         if (score == null) return '#ccc'; // fallback

//         const min = 0;
//         const max = 780;
//         const percent = Math.min(1, Math.max(0, (score - min) / (max - min))); // normalize

//         const hue = (1 - percent) * 120; // green (120°) to red (0°)
//         return `hsl(${hue}, 100%, 50%)`;
//     };

//     // Step 4: Leaflet region style
//     const regionStyle = (feature) => {
//         const regionName = feature.properties?.CTYUA24NM?.trim();
//         const score = getRegionScore(regionName);

//         return {
//             fillColor: getColor(score),
//             weight: 1,
//             opacity: 1,
//             color: 'black',
//             fillOpacity: 0.7
//         };
//     };





//     return (
//         <div className="Map">

//             {/* <div className="score-toggle">
//                 <div className="header">
//                     <p>Scores</p>
//                 </div>
//                 <button
//                     className={scoreType === 'crimeScore' ? 'red' : ''}
//                     onClick={() => setScoreType('crimeScore')}
//                 >
//                     Detected Crime Rate
//                 </button>
//                 <button
//                     className={scoreType === 'sentimentScore' ? 'green' : ''}
//                     onClick={() => setScoreType('sentimentScore')}
//                 >
//                     Negative Sentiment
//                 </button>
//             </div> */}

//             <div className="legend">
//                 <div className="gradient-bar"></div>
//                 <div className="legend-labels">
//                     <span>0</span>
//                     <span>400</span>
//                     <span>800</span>
//                 </div>
//             </div>

//             <div className="time-selector">
//                 <div className="dropdowns">
//                     <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
//                         {[2019, 2020, 2021, 2022, 2023, 2024].map(year => (
//                             <option key={year} value={year}>{year}</option>
//                         ))}
//                     </select>
//                     <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
//                         {[...Array(12)].map((_, i) => (
//                             <option key={i + 1} value={i + 1}>{i + 1}</option>
//                         ))}
//                     </select>
//                 </div>
//             </div>



//             <MapContainer
//                 center={[56.4907, -4.2026]}
//                 zoom={6}
//                 style={{ height: "100vh", width: "100%" }}
//                 minZoom={3}
//             >
//                 <TileLayer
//                     attribution='&copy; OpenStreetMap'
//                     url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//                 />

//                 <GeoJSON
//                     data={geoData}
//                     style={regionStyle}
//                     onEachFeature={(feature, layer) => {
//                         const regionName = feature.properties.CTYUA24NM;
//                         const score = getRegionScore(regionName);
//                         layer.bindPopup(`<strong>${regionName}</strong><br>Crime Rate (Dec 2024): ${score?.toFixed(2) ?? 'N/A'}`);
//                     }}
//                 />

//                 {/* {mapData.map((city, index) => (
//                     <Marker
//                         key={index}
//                         position={[city.lat, city.lng]}
//                         icon={scoreType === 'crimeScore' ? redIcon : greenIcon}
//                     >

//                         <Tooltip
//                             direction="top"
//                             offset={[0, -10]}
//                             opacity={1}
//                             sticky
//                         >
//                             <b>{city.name}</b><br />
//                             {scoreType === 'crimeScore'
//                                 ? `Crime Score: ${city.crimeScore}`
//                                 : `Sentiment Score: ${city.sentimentScore}`}
//                         </Tooltip>


//                         <Popup>
//                             <b>{city.name}</b><br />
//                             {scoreType === 'crimeScore'
//                                 ? `Detected Crime Rate: ${city.crimeScore}`
//                                 : `Negative Sentiment : ${city.sentimentScore}`}
//                         </Popup>

//                     </Marker>
//                 ))} */}

//             </MapContainer>
//         </div>
//     );
// }

// export default HomePage;
