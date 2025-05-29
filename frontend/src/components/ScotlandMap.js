import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/ScotlandMap.css';
import { useState, useEffect, useMemo } from 'react';
import regionalData from '../data/new_monthly_data.json';

function ScotlandMap() {
    const [scoreType, setScoreType] = useState('crimeScore');
    const [selectedYear, setSelectedYear] = useState(2024);
    const [selectedMonth, setSelectedMonth] = useState(12);
    const [geoData, setGeoData] = useState(null);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Fetch GeoJSON file once
    useEffect(() => {
        fetch('/data/scotland-geodata.json')
            .then((res) => res.json())
            .then((data) => setGeoData(data))
            .catch((err) => console.error('Failed to load geoData:', err));
    }, []);

    // Precompute the scores for the selected year/month
    const regionalScoreMap = useMemo(() => {
        const map = {};
        for (const entry of regionalData) {
            if (
                entry.year === selectedYear &&
                entry.month === selectedMonth &&
                entry['WARD CODE']
            ) {
                const key = entry['WARD CODE'];
                const value =
                    scoreType === 'crimeScore'
                        ? parseFloat(entry['DETECTED CRIME'])
                        : parseFloat(entry['neg_ratio']);

                if (!isNaN(value)) map[key] = value;
            }
        }
        return map;
    }, [scoreType, selectedYear, selectedMonth]);

    const getRegionScore = (wardCode) => {
        return regionalScoreMap[wardCode] ?? null;
    };

    const getColor = (score) => {
        if (score == null || score < 0) return '#ccc';

        if (scoreType === 'crimeScore') {
            const thresholds = [0, 1, 2, 4, 6, 7, 10, 13, 17, 23, 248]; // 0–100th percentile

            // Find the index of the threshold range
            let index = thresholds.findIndex((t) => score <= t);
            if (index === -1) index = thresholds.length - 1;

            const percent = index / (thresholds.length - 1); // Normalize 0–1
            const hue = (1 - percent) * 120;

            return `hsl(${hue}, 100%, 50%)`;
        }

        if (scoreType === 'sentimentScore') {
            const clamped = Math.max(0, Math.min(1, score));
            const hue = (1 - clamped) * 120;
            return `hsl(${hue}, 100%, 50%)`;
        }

        return '#ccc';
    };



    const regionStyle = (feature) => {
        const score = getRegionScore(feature.id);
        return {
            fillColor: getColor(score),
            weight: 1,
            opacity: 1,
            color: 'black',
            fillOpacity: 0.7
        };
    };

    const onEachRegion = (feature, layer) => {
        const wardCode = feature.id;
        const regionName = feature.properties.WD13NM;
        const score = getRegionScore(wardCode);
        const label = scoreType === 'crimeScore' ? 'Crime Rate' : 'Negative Sentiment';
        const popupContent = `<strong>${regionName}</strong><br>${label} (${selectedMonth}/${selectedYear}): ${score?.toFixed(2) ?? 'N/A'}`;
        layer.bindPopup(popupContent);
    };

    return (
        <div className="Map"
            style={{
                width: '70%',
                height: '70%',
                margin: '0 auto',
                paddingTop: '2rem',
            }}>

            <>
                <div className="legend">
                    <div className={`gradient-bar ${scoreType === 'sentimentScore' ? 'sentiment' : 'crime'}`}></div>
                    <div className={`legend-labels ${scoreType === 'sentimentScore' ? 'sentiment' : 'crime'}`}>
                        {scoreType === 'sentimentScore' ? (
                            <>
                                <span>0</span><span>0.2</span><span>0.4</span><span>0.6</span><span>0.8</span><span>1</span>
                            </>
                        ) : (
                            <>
                                <span>0</span><span>1</span><span>2</span><span>4</span><span>6</span>
                                <span>7</span><span>10</span><span>13</span><span>17</span><span>23</span><span>248</span>
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
            </>


            <MapContainer
                center={[57.4907, -4.2026]}
                zoom={6}
                style={{ height: "100vh", width: "100%" }}
                minZoom={3}
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {geoData && (
                    <GeoJSON
                        key={`${scoreType}-${selectedYear}-${selectedMonth}`}
                        data={geoData}
                        style={regionStyle}
                        onEachFeature={onEachRegion}
                    />
                )}
            </MapContainer>
        </div>
    );
}

export default ScotlandMap
