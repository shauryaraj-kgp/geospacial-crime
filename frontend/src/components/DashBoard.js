import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from 'recharts';
import regionalData from '../data/final_df.json';
import '../styles/DashBoard.css';

const allRegions = [...new Set(regionalData.map(entry => entry.source_location))].sort();


const getMonthlyCrimeData = (region) => {
    return Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const entry = regionalData.find(
            (d) => d.source_location === region && d.year === 2024 && d.month === month
        );
        return {
            month,
            crime: entry ? parseFloat(entry['DETECTED CRIME']) : null,
            sentiment: entry ? parseFloat(entry['neg_ratio']) : null
        };
    });
};


const DashBoard = () => {
    const [selectedRegion, setSelectedRegion] = useState(allRegions[0]);
    const chartData = getMonthlyCrimeData(selectedRegion);

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <h1>Scotland Crime Data Intelligence</h1>
                <p>
                    This dashboard provides a comprehensive view of detected crime trends and public sentiment
                    across the Scotland. Use the tools below to explore regional patterns and visualize geographic hotspots.
                </p>
            </header>

            <div className="dashboard-main">
                <div className="chart-panel">
                    <div className="chart-header">
                        <label htmlFor="region-select">Select Region:</label>
                        <select
                            id="region-select"
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                        >
                            {allRegions.map(region => (
                                <option key={region} value={region}>{region}</option>
                            ))}
                        </select>
                    </div>

                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData} margin={{ top: 20, right: 50, left: 40, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" tickFormatter={(m) => `M${m}`} />
                            <YAxis yAxisId="left" orientation="left" domain={[0, 'auto']} />
                            <YAxis yAxisId="right" orientation="right" domain={[0, 1]} />
                            <Tooltip />

                            {/* Shadow areas under the lines */}
                            <defs>
                                <linearGradient id="redShadow" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#ff4d4f" stopOpacity={0.4} />
                                    <stop offset="100%" stopColor="#ff4d4f" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="greenShadow" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#52c41a" stopOpacity={0.4} />
                                    <stop offset="100%" stopColor="#52c41a" stopOpacity={0} />
                                </linearGradient>
                            </defs>

                            <Area
                                yAxisId="left"
                                type="monotone"
                                dataKey="crime"
                                stroke="none"
                                fill="url(#redShadow)"
                            />
                            <Area
                                yAxisId="right"
                                type="monotone"
                                dataKey="sentiment"
                                stroke="none"
                                fill="url(#greenShadow)"
                            />

                            {/* Main chart lines */}
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="crime"
                                stroke="#ff4d4f"
                                strokeWidth={2}
                                dot
                                name="Detected Crime"
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="sentiment"
                                stroke="#52c41a"
                                strokeWidth={2}
                                dot
                                name="Negative Sentiment"
                            />
                        </LineChart>
                    </ResponsiveContainer>


                </div>

                <div className="map-panel map-preview" style={{ position: 'relative', cursor: 'pointer' }}>
                    <a href="/map" target="_blank" rel="noopener noreferrer" style={{ display: 'block', height: '100%' }}>
                        <iframe
                            title="Crime Map Preview"
                            src="/map?preview=true"
                            width="100%"
                            height="100%"
                            style={{ border: 'none', borderRadius: '8px', pointerEvents: 'none' }}
                        />
                        <div className="map-overlay">Click to expand →</div>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default DashBoard;
