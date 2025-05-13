import React from 'react';
import '../styles/ModernChartHeader.css';
import RegionSelector from './RegionSelector';

export function ModernChartHeader({
    selectedRegion,
    setSelectedRegion,
    allRegions,
    selectedYear,
    setSelectedYear,
    allYears,
    selectedMonth,
    setSelectedMonth
}) {
    const months = [
        'January', 'February', 'March', 'April',
        'May', 'June', 'July', 'August',
        'September', 'October', 'November', 'December'
    ];

    return (
        <div className="chart-header-horizontal">
            <div className="filter-group">
                <span className="filter-label">Region:</span>
                <RegionSelector
                    selectedRegion={selectedRegion}
                    setSelectedRegion={setSelectedRegion}
                    allRegions={allRegions}
                />
            </div>

            <div className="filter-group">
                <span className="filter-label">Year:</span>
                <select
                    className="dropdown-select"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                    {allYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
            </div>

            <div className="filter-group">
                <span className="filter-label">Month:</span>
                <select
                    className="dropdown-select"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                >
                    {months.map((name, index) => (
                        <option key={index + 1} value={index + 1}>{name}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}
