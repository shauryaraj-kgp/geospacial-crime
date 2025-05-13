import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import regionalData from '../data/final_df.json';
import daywiseData from '../data/daywise_crime.json';
import '../styles/DashBoard.css';

const allRegions = [...new Set(regionalData.map(entry => entry.source_location))].sort();
const allYears = [2019, 2020, 2021, 2022, 2023, 2024];

const getMonthlyCrimeData = (region, year) => {
    return Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const entry = regionalData.find(
            (d) => d.source_location === region && d.year === year && d.month === month
        );
        return {
            month,
            crime: entry ? parseFloat(entry['DETECTED CRIME']) : null,
            sentiment: entry ? parseFloat(entry['neg_ratio']) : null
        };
    });
};

const getDailyCrimeData = (data, region, year, month) => {
    const days = Array.from({ length: 30 }, (_, i) => i + 1);
    return days.map(day => {
        const entry = daywiseData.find(
            d =>
                d.source_location === region &&
                d.year === year &&
                d.month === month &&
                d.day === day
        );
        return {
            day,
            crime: entry ? parseFloat(entry['DETECTED CRIME']) : null
        };
    });
};

const DashBoard = () => {
    const [selectedRegion, setSelectedRegion] = useState(allRegions[0]);
    const [selectedYear, setSelectedYear] = useState(2024);
    const [selectedMonth, setSelectedMonth] = useState(12);

    // Monthly chart data, calculated only when region or year changes
    const monthlyChartData = useMemo(() => {
        return getMonthlyCrimeData(selectedRegion, selectedYear);
    }, [selectedRegion, selectedYear]);

    // Daily chart data, calculated only when region, year, or month changes
    const dailyChartData = useMemo(() => {
        return getDailyCrimeData(daywiseData, selectedRegion, selectedYear, selectedMonth);
    }, [selectedRegion, selectedYear, selectedMonth]);

    return (
        <div className="dashboard-wrapper">
            <div className="dashboard">
                <header className="dashboard-header">
                    <h1>Scotland Crime Data Statistics</h1>
                    <p>
                        This dashboard provides a comprehensive view of detected crime trends and public sentiment
                        across Scotland. Use the tools below to explore regional patterns and visualize geographic hotspots.
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

                            <label htmlFor="year-select" style={{ marginLeft: '1rem' }}>Select Year:</label>
                            <select
                                id="year-select"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                            >
                                {allYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>

                        {/* Monthly Crime Data Line Chart */}
                        <ResponsiveContainer width="100%" height={320}>

                            <LineChart data={monthlyChartData} margin={{ top: 35, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="month"
                                    tickFormatter={(m) =>
                                        ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
                                            'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]
                                    }
                                />

                                <YAxis yAxisId="left" orientation="left" domain={[0, 'auto']} />
                                <YAxis yAxisId="right" orientation="right" domain={[0, 1]} />

                                <Tooltip
                                    labelFormatter={(label) =>
                                        ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                                            'August', 'September', 'October', 'November', 'December'][label - 1]
                                    }
                                />

                                <defs>
                                    <filter id="redGlow" x="-50%" y="-50%" width="200%" height="200%">
                                        <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ff4d4f" floodOpacity="1" />
                                    </filter>
                                    <filter id="greenGlow" x="-50%" y="-50%" width="200%" height="200%">
                                        <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#52c41a" floodOpacity="1" />
                                    </filter>
                                </defs>

                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="crime"
                                    stroke="#ff4d4f"
                                    strokeWidth={3}
                                    dot={{ stroke: '#ff4d4f', strokeWidth: 2 }}
                                    style={{ filter: "url(#redGlow)" }}
                                    name="Detected Crime"
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="sentiment"
                                    stroke="#52c41a"
                                    strokeWidth={3}
                                    dot={{ stroke: '#52c41a', strokeWidth: 2 }}
                                    style={{ filter: "url(#greenGlow)" }}
                                    name="Negative Sentiment"
                                />

                            </LineChart>
                        </ResponsiveContainer>

                    </div>

                    <div className="chart-panel">

                        <div className="chart-header">
                            <label htmlFor="region-select">Select Month:</label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        {i + 1}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Daily Crime Data Line Chart */}
                        <ResponsiveContainer width="100%" height={320}>
                            <LineChart data={dailyChartData} margin={{ top: 35, right: 30, left: 10, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="day"
                                    tickFormatter={(d) => d}
                                    interval={2}
                                />
                                <YAxis domain={[0, 'auto']} />

                                <Tooltip
                                    labelFormatter={(label) => `Day ${label}`}
                                    formatter={(value) => [value, "Detected Crime"]}
                                />

                                <defs>
                                    <filter id="redGlow" x="-50%" y="-50%" width="200%" height="200%">
                                        <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ff4d4f" floodOpacity="1" />
                                    </filter>
                                </defs>

                                <Line
                                    type="monotone"
                                    dataKey="crime"
                                    stroke="#ff4d4f"
                                    strokeWidth={3}
                                    dot={{ stroke: '#ff4d4f', strokeWidth: 2 }}
                                    style={{ filter: "url(#redGlow)" }}
                                    name="Detected Crime"
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
        </div>
    );
};

export default DashBoard;
