import React, { useState, useMemo } from 'react';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import regionalData from '../data/final_df.json';
import daywiseData from '../data/daywise_crime.json';
import '../styles/DashBoard.css';

import {
    Box, Paper, Typography, Tabs, Tab, TextField,
    Button, IconButton, Chip, Divider, Menu, MenuItem,
    InputAdornment, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TablePagination,
    TableSortLabel, LinearProgress, Alert, CircularProgress,
    Card, CardContent, Stack, Stepper, Step, StepLabel,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Snackbar, Autocomplete
} from '@mui/material';
import {
    Search, Add, FilterList, CloudDownload,
    DeleteOutline, EditOutlined, VisibilityOutlined,
    LocationOn, CheckCircle, HighlightOff, LocalHospital,
    School, HomeWork, Engineering, WaterDrop
} from '@mui/icons-material';
import {
    LineChart
} from '@mui/x-charts';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import dayjs from 'dayjs';



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
    const [selectedRegion, setSelectedRegion] = useState(null);
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [locationQuery, setLocationQuery] = useState('');
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [tempDate, setTempDate] = useState(dayjs('2024-12-01'));




    // Monthly chart data, calculated only when region or year changes
    const monthlyChartData = useMemo(() => {
        return getMonthlyCrimeData(selectedRegion, selectedYear);
    }, [selectedRegion, selectedYear]);


    // Daily chart data, calculated only when region, year, or month changes
    const dailyChartData = useMemo(() => {
        return getDailyCrimeData(daywiseData, selectedRegion, selectedYear, selectedMonth);
    }, [selectedRegion, selectedYear, selectedMonth]);


    const handleSearchLocation = (query) => {
        if (!allRegions.includes(query)) {
            alert("Please select a valid region from the list.");
            return;
        }
    };


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

                <Paper sx={{ p: 3, mb: 3, boxShadow: 5 }}>
                    <Typography variant="h6" gutterBottom>Search Location</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Enter a location to see its crime statistics
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Autocomplete
                            freeSolo
                            options={allRegions}
                            inputValue={locationQuery}
                            onInputChange={(event, newInputValue) => setLocationQuery(newInputValue)}
                            onChange={(event, newValue) => {
                                if (newValue) {
                                    setLocationQuery(newValue);
                                    handleSearchLocation(newValue);
                                    setSelectedRegion(newValue);
                                }
                            }}
                            sx={{ flexGrow: 1 }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Enter city, district, or region name..."
                                    InputProps={{
                                        ...params.InputProps,
                                        startAdornment: (
                                            <>
                                                <InputAdornment position="start">
                                                    <LocationOn />
                                                </InputAdornment>
                                                {params.InputProps.startAdornment}
                                            </>
                                        )
                                    }}
                                />
                            )}
                        />


                        <Button
                            variant="contained"
                            onClick={() => setSelectedRegion(locationQuery)}
                            sx={{ px: 4, fontSize: 15 }}
                        >
                            Search
                        </Button>
                    </Box>
                </Paper>


                {selectedRegion && locationQuery && (
                    <Box textAlign="center" sx={{ mb: 4 }}>
                        <Button
                            variant="outlined"
                            onClick={() => setCalendarOpen(true)}
                            sx={{ fontSize: 16, px: 4 }}
                        >
                            {
                                (selectedYear && selectedMonth) ?
                                    `Change Month (${selectedMonth}, ${selectedYear})` :
                                    'Select Month and Year'
                            }
                        </Button>
                    </Box>
                )}

                <Dialog open={calendarOpen} onClose={() => setCalendarOpen(false)}>
                    <DialogTitle>Select Month and Year</DialogTitle>
                    <DialogContent>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DateCalendar
                                views={['year', 'month']}
                                openTo="month"
                                value={tempDate}
                                minDate={dayjs('2019-04-01')}
                                maxDate={dayjs('2024-12-31')}
                                onChange={(newValue) => setTempDate(newValue)}
                            />
                        </LocalizationProvider>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setCalendarOpen(false)}>Cancel</Button>
                        <Button
                            variant="contained"
                            onClick={() => {
                                setSelectedYear(tempDate.year());
                                setSelectedMonth(tempDate.month() + 1); // dayjs months are 0-based
                                setCalendarOpen(false);
                            }}
                        >
                            Confirm
                        </Button>
                    </DialogActions>
                </Dialog>


                {selectedRegion && locationQuery && selectedMonth && selectedYear &&
                    <div className="dashboard-main">
                        <Paper sx={{ p: 3, mb: 3, boxShadow: 5 }}>
                            {/* Monthly Crime Data Line Chart */}
                            <LineChart
                                height={320}
                                xAxis={[
                                    {
                                        data: monthlyChartData.map((d) => d.month),
                                        valueFormatter: (value) =>
                                            ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
                                                'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][value - 1],
                                        label: 'Month',
                                    },
                                ]}
                                yAxis={[
                                    { id: 'left', label: 'Detected Crime' },
                                    { id: 'right', label: 'Negative Sentiment', position: 'right' },
                                ]}
                                series={[
                                    {
                                        yAxisKey: 'left',
                                        data: monthlyChartData.map((d) => d.crime),
                                        label: 'Detected Crime',
                                        color: '#ff4d4f',
                                        curve: 'monotone',
                                    },
                                    {
                                        yAxisKey: 'right',
                                        data: monthlyChartData.map((d) => d.sentiment),
                                        label: 'Negative Sentiment',
                                        color: '#52c41a',
                                        curve: 'monotone',
                                    },
                                ]}
                                tooltip={{ trigger: 'axis' }}
                            />
                        </Paper>

                        <Paper sx={{ p: 3, mb: 3, boxShadow: 5 }}>
                            {/* Daily Crime Data Line Chart */}
                            <LineChart
                                height={320}
                                xAxis={[
                                    {
                                        data: dailyChartData.map((d) => d.day),
                                        label: 'Day',
                                    },
                                ]}
                                yAxis={[
                                    {
                                        label: 'Detected Crime',
                                    },
                                ]}
                                series={[
                                    {
                                        data: dailyChartData.map((d) => d.crime),
                                        label: 'Detected Crime',
                                        color: '#ff4d4f',
                                        curve: 'monotone',
                                    },
                                ]}
                                tooltip={{ trigger: 'axis' }}
                            />
                        </Paper>
                    </div>
                }
            </div>
        </div>
    );
};

export default DashBoard;

{/* <div className="map-panel map-preview" style={{ position: 'relative', cursor: 'pointer' }}>
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
</div> */}