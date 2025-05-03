import { MapContainer, TileLayer } from 'react-leaflet';
import { GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/HomePage.css';
import { useState } from 'react';
import regionalData from '../data/final_df.json'
import geoData from '../data/Counties_and_Unitary_Authorities_December_2024_Boundaries_UK_BFE_-1559183835153833632.json'

function HomePage() {

    const [selectedYear, setSelectedYear] = useState(2024);
    const [selectedMonth, setSelectedMonth] = useState(12);

    // Create mapping from region name to DETECTED CRIME score for selected year & month
    const regionalScoreMap = {};
    if (Array.isArray(regionalData)) {
        regionalData.forEach(entry => {
            if (
                entry.year === selectedYear &&
                entry.month === selectedMonth &&
                entry.source_location &&
                !isNaN(entry['DETECTED CRIME'])
            ) {
                regionalScoreMap[entry.source_location] = parseFloat(entry['DETECTED CRIME']);
            }
        });
    }

    // Step 2: Lookup score by region name
    const getRegionScore = (regionName) => {
        return regionalScoreMap[regionName] ?? null;
    };

    // Step 3: Generate color from 0 (green) to 780 (red)
    const getColor = (score) => {
        if (score == null) return '#ccc'; // fallback

        const min = 0;
        const max = 780;
        const percent = Math.min(1, Math.max(0, (score - min) / (max - min))); // normalize

        const hue = (1 - percent) * 120; // green (120°) to red (0°)
        return `hsl(${hue}, 100%, 50%)`;
    };

    // Step 4: Leaflet region style
    const regionStyle = (feature) => {
        const regionName = feature.properties.CTYUA24NM;
        const score = getRegionScore(regionName);
        return {
            fillColor: getColor(score),
            weight: 1,
            opacity: 1,
            color: 'black',
            fillOpacity: 0.7
        };
    };


    return (
        <div className="Map">
            <div className="legend" style={{ zIndex: 1000 }}>
                <div className="gradient-bar"></div>
                <div className="legend-labels">
                    <span>0</span>
                    <span>400</span>
                    <span>800</span>
                </div>
            </div>

            <div className="time-selector" style={{ zIndex: 1000 }}>
                <div className="dropdowns">
                    <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                        {[2019, 2020, 2021, 2022, 2023, 2024].map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                        {[...Array(12)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                    </select>
                </div>
            </div>

            <MapContainer
                center={[56.4907, -4.2026]}
                zoom={6}
                style={{ height: "100vh", width: "100%" }}
                minZoom={3}
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <GeoJSON
                    key={`${selectedYear}-${selectedMonth}`} // 👈 force re-render when selection changes
                    data={geoData}
                    style={regionStyle}
                    onEachFeature={(feature, layer) => {
                        const regionName = feature.properties.CTYUA24NM;
                        const score = getRegionScore(regionName);
                        layer.bindPopup(
                            `<strong>${regionName}</strong><br>Crime Rate (${selectedMonth}/${selectedYear}): ${score?.toFixed(2) ?? 'N/A'}`
                        );
                    }}
                />

            </MapContainer>
        </div>
    );
}

export default HomePage;