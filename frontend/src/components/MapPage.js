import { MapContainer, TileLayer } from 'react-leaflet';
import { GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/MapPage.css';
import { useState, useEffect } from 'react';
import regionalData from '../data/final_df.json';
import { useLocation } from 'react-router-dom';


function MapPage() {
    const [scoreType, setScoreType] = useState('crimeScore');
    const [selectedYear, setSelectedYear] = useState(2024);
    const [selectedMonth, setSelectedMonth] = useState(12);

    const location = useLocation();
    const isPreview = new URLSearchParams(location.search).get('preview') === 'true';

    const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const [geoData, setGeoData] = useState(null);

    useEffect(() => {
        fetch('/data/Counties_and_Unitary_Authorities_December_2024_Boundaries_UK_BFE_-1559183835153833632.json')
            .then((res) => res.json())
            .then((data) => setGeoData(data))
            .catch((err) => console.error('Failed to load geoData:', err));
    }, []);

    // Dynamic mapping based on selected score type
    const regionalScoreMap = {};
    if (Array.isArray(regionalData)) {
        regionalData.forEach(entry => {
            if (
                entry.year === selectedYear &&
                entry.month === selectedMonth &&
                entry.source_location
            ) {
                if (scoreType === 'crimeScore' && !isNaN(entry['DETECTED CRIME'])) {
                    regionalScoreMap[entry.source_location] = parseFloat(entry['DETECTED CRIME']);
                } else if (scoreType === 'sentimentScore' && !isNaN(entry['neg_ratio'])) {
                    regionalScoreMap[entry.source_location] = parseFloat(entry['neg_ratio']);
                }
            }
        });
    }

    const getRegionScore = (regionName) => {
        return regionalScoreMap[regionName] ?? null;
    };

    const getColor = (score) => {
        if (score == null || score < 0) return '#ccc';

        if (scoreType === 'crimeScore') {
            // Crime score: log scale, emphasize 50–250
            const focusMin = 50;
            const focusMax = 250;
            const globalMin = 1;
            const globalMax = 800;

            const logGlobalMin = Math.log10(globalMin);
            const logGlobalMax = Math.log10(globalMax);
            const logScore = Math.log10(score);

            let percent = (logScore - logGlobalMin) / (logGlobalMax - logGlobalMin);
            percent = Math.min(1, Math.max(0, percent));

            const focusPercent = (logScore - Math.log10(focusMin)) / (Math.log10(focusMax) - Math.log10(focusMin));
            const adjustedPercent = Math.min(1, Math.max(0, focusPercent));

            const finalPercent = 0.2 + 0.6 * adjustedPercent + 0.2 * percent;

            const hue = (1 - finalPercent) * 120; // green to red
            return `hsl(${hue}, 100%, 50%)`;
        }

        if (scoreType === 'sentimentScore') {
            // Sentiment score: linear 0 (green) → 1 (red)
            const clamped = Math.max(0, Math.min(1, score));
            const hue = (1 - clamped) * 120;
            return `hsl(${hue}, 100%, 50%)`;
        }

        return '#ccc';
    };

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
            {!isPreview &&
                (<div>
                    <div className="legend">
                        <div className={`gradient-bar ${scoreType === 'sentimentScore' ? 'sentiment' : 'crime'}`}></div>
                        <div className={`legend-labels ${scoreType === 'sentimentScore' ? 'sentiment' : 'crime'}`}>
                            {scoreType === 'sentimentScore' ? (
                                <>
                                    <span>0</span>
                                    <span>0.2</span>
                                    <span>0.4</span>
                                    <span>0.6</span>
                                    <span>0.8</span>
                                    <span>1</span>
                                </>
                            ) : (
                                <>
                                    <span>1</span>
                                    <span>10</span>
                                    <span>50</span>
                                    <span>100</span>
                                    <span>250</span>
                                    <span>800</span>
                                </>
                            )}
                        </div>
                    </div>


                    <div className="score-toggle">
                        <p>Scores</p>
                        <button
                            className={scoreType === 'crimeScore' ? 'red' : ''}
                            onClick={() => setScoreType('crimeScore')}
                        >
                            Detected Crime Rate
                        </button>
                        <button
                            className={scoreType === 'sentimentScore' ? 'green' : ''}
                            onClick={() => setScoreType('sentimentScore')}
                        >
                            Negative Sentiment
                        </button>
                    </div>

                    <div className="time-selector-container">
                        <div className="time-selector-card">
                            <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                                {monthNames.map((name, i) => (
                                    <option key={i + 1} value={i + 1}>{name}</option>
                                ))}
                            </select>
                            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                                {[2019, 2020, 2021, 2022, 2023, 2024].map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                </div>
                )
            }

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

                {geoData && (
                    <GeoJSON
                        key={`${scoreType}-${selectedYear}-${selectedMonth}`}
                        data={geoData}
                        style={regionStyle}
                        onEachFeature={(feature, layer) => {
                            const regionName = feature.properties.CTYUA24NM;
                            const score = getRegionScore(regionName);
                            const label = scoreType === 'crimeScore' ? 'Crime Rate' : 'Negative Sentiment';
                            layer.bindPopup(
                                `<strong>${regionName}</strong><br>${label} (${selectedMonth}/${selectedYear}): ${score?.toFixed(2) ?? 'N/A'}`
                            );
                        }}
                    />
                )}

            </MapContainer>
        </div>
    );
}

export default MapPage;
