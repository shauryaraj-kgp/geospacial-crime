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

    const getColor = (score) => {
        if (score == null || score <= 0) return '#ccc';

        // Focus on 50–250, but still handle 1–800
        const focusMin = 50;
        const focusMax = 250;
        const globalMin = 1;
        const globalMax = 800;

        // Log scale transformation for the global range (1-800)
        const logGlobalMin = Math.log10(globalMin);
        const logGlobalMax = Math.log10(globalMax);
        const logScore = Math.log10(score);

        // Normalize the log score to the range [0, 1] for the full 1-800 range
        let percent = (logScore - logGlobalMin) / (logGlobalMax - logGlobalMin);
        percent = Math.min(1, Math.max(0, percent)); // Clamp to [0,1]

        // Now, we stretch the [50, 250] range more heavily within the gradient
        const focusPercent = (logScore - Math.log10(focusMin)) / (Math.log10(focusMax) - Math.log10(focusMin));
        const adjustedPercent = Math.min(1, Math.max(0, focusPercent)); // Clamp to [0,1]

        // Combine the two percent calculations, giving more importance to the 50-250 range
        const finalPercent = 0.2 + 0.6 * adjustedPercent + 0.2 * percent;

        // Calculate the hue based on the final percent (green to red)
        const hue = (1 - finalPercent) * 120; // green (120) to red (0)
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
            <div className="legend">
                <div className="gradient-bar"></div>
                <div className="legend-labels">
                    <span>1</span>
                    <span>10</span>
                    <span>50</span>
                    <span>100</span>
                    <span>250</span>
                    <span>800</span>
                </div>
            </div>



            <div className="time-selector-container">
                <div className="time-selector-card">
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
                center={[57.4907, -4.2026]}
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