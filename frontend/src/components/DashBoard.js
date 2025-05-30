import React, { useState, useMemo } from 'react';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import regionalData from '../data/new_monthly_data.json';
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
    Snackbar, Autocomplete, List, ListItem, ListItemText
} from '@mui/material';
import {
    Search, Add, FilterList, CloudDownload,
    DeleteOutline, EditOutlined, VisibilityOutlined,
    LocationOn, CheckCircle, HighlightOff, LocalHospital,
    School, HomeWork, Engineering, WaterDrop, Group, MoodBad
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
                    <Box className="dashboard-main" sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
                        {/* Left: Charts (70%) */}
                        <Box sx={{ flex: 0.7, minWidth: 0 }}>
                            {/* Monthly Crime Data Line Chart */}
                            <Paper sx={{ p: 3, mb: 3, boxShadow: 5 }}>
                                <LineChart
                                    height={220}
                                    xAxis={[{
                                        data: monthlyChartData.map((d) => d.month),
                                        valueFormatter: (value) => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][value - 1],
                                        label: 'Month',
                                    }]}
                                    yAxis={[{ label: 'Detected Crime' }]}
                                    series={[{
                                        data: monthlyChartData.map((d) => d.crime),
                                        label: 'Detected Crime',
                                        color: '#ff4d4f',
                                        curve: 'monotone',
                                        area: true,
                                    }]}
                                    tooltip={{ trigger: 'axis' }}
                                />
                            </Paper>
                            {/* Negative Sentiment Line Chart */}
                            <Paper sx={{ p: 3, mb: 3, boxShadow: 5 }}>
                                <LineChart
                                    height={220}
                                    xAxis={[{
                                        data: monthlyChartData.map((d) => d.month),
                                        valueFormatter: (value) => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][value - 1],
                                        label: 'Month',
                                    }]}
                                    yAxis={[{ label: 'Negative Sentiment' }]}
                                    series={[{
                                        data: monthlyChartData.map((d) => d.sentiment),
                                        label: 'Negative Sentiment',
                                        color: '#52c41a',
                                        curve: 'monotone',
                                        area: true,
                                    }]}
                                    tooltip={{ trigger: 'axis' }}
                                />
                            </Paper>
                            {/* Daily Crime Data Line Chart */}
                            <Paper sx={{ p: 3, mb: 3, boxShadow: 5 }}>
                                <LineChart
                                    height={220}
                                    xAxis={[{ data: dailyChartData.map((d) => d.day), label: 'Day' }]}
                                    yAxis={[{ label: 'Detected Crime' }]}
                                    series={[{
                                        data: dailyChartData.map((d) => d.crime),
                                        label: 'Detected Crime',
                                        color: '#ff4d4f',
                                        curve: 'monotone',
                                        area: true
                                    }]}
                                    tooltip={{ trigger: 'axis' }}
                                />
                            </Paper>
                        </Box>
                        {/* Right: Region Details (30%) */}
                        <Box sx={{ flex: 0.3, minWidth: 0, mb: 5 }}>
                            <Card sx={{ height: '100%', overflow: 'auto', p: 2 }}>
                                {/* Compute region details */}
                                {(() => {
                                    // Find the entry for this region/month/year
                                    const entry = regionalData.find(d => d.source_location === selectedRegion && d.year === selectedYear && d.month === selectedMonth);
                                    if (!entry) return <Typography>No data for this region/month.</Typography>;
                                    // Compute ranks
                                    const monthEntries = regionalData.filter(d => d.year === selectedYear && d.month === selectedMonth);
                                    const crimeRanked = [...monthEntries].sort((a, b) => b['DETECTED CRIME'] - a['DETECTED CRIME']);
                                    const sentimentRanked = [...monthEntries].sort((a, b) => b['neg_ratio'] - a['neg_ratio']);
                                    const crimeRank = crimeRanked.findIndex(d => d.source_location === selectedRegion) + 1;
                                    const sentimentRank = sentimentRanked.findIndex(d => d.source_location === selectedRegion) + 1;
                                    // Status color and label
                                    const crime = entry['DETECTED CRIME'];
                                    let statusColor = 'success', statusText = 'Safe';
                                    if (crime > 40) { statusColor = 'error'; statusText = 'High Crime Rate'; }
                                    else if (crime > 25) { statusColor = 'warning'; statusText = 'Moderately High'; }
                                    else if (crime > 15) { statusColor = 'yellow'; statusText = 'Relatively Safe'; }
                                    else { statusColor = 'success'; statusText = 'Safe'; }
                                    // Crime reasons
                                    const metaFields = ['source_location', 'COUNCIL NAME', 'WARD CODE', 'Population_Census_2022-03-20', 'Area', 'longitude', 'latitude', 'year', 'month', 'DETECTED CRIME', 'neg_ratio'];
                                    const reasons = Object.entries(entry)
                                        .filter(([k, v]) => !metaFields.includes(k) && typeof v === 'number' && v > 0)
                                        .sort((a, b) => b[1] - a[1]);
                                    // Meta info
                                    const council = entry['COUNCIL NAME'];
                                    const population = entry['Population_Census_2022-03-20'];
                                    const area = entry['Area'];
                                    // Optionally: add more info
                                    return (
                                        <>
                                            <Tabs value={0} variant="fullWidth" sx={{ mb: 2 }}>
                                                <Tab label="Region Details" />
                                            </Tabs>
                                            <Typography variant="h5" gutterBottom>{selectedRegion}</Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', fontSize: 32, mr: 2 }}>#{crimeRank}</Typography>
                                                <Typography variant="body1">Crime Rank</Typography>
                                                <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
                                                <Typography variant="h6" color="secondary" sx={{ fontWeight: 'bold', fontSize: 32, mr: 2 }}>#{sentimentRank}</Typography>
                                                <Typography variant="body1">Negative Sentiment Rank</Typography>
                                            </Box>
                                            <Box sx={{ mb: 2 }}>
                                                <Chip label={statusText} color={statusColor === 'yellow' ? undefined : statusColor} sx={{ fontSize: 18, bgcolor: statusColor === 'yellow' ? 'yellow' : undefined, color: statusColor === 'yellow' ? 'black' : undefined, px: 2, py: 1, fontWeight: 'bold', fontFamily: 'monospace', fontSize: 22 }} />
                                                <Typography variant="body2" sx={{ mt: 1 }}>
                                                    {crime > 50 && 'This region has a high crime rate for this month.'}
                                                    {crime > 35 && crime <= 50 && 'This region has a moderately high crime rate.'}
                                                    {crime > 25 && crime <= 35 && 'This region is relatively safe.'}
                                                    {crime <= 25 && 'This region is considered safe.'}
                                                </Typography>
                                            </Box>
                                            <Divider sx={{ my: 2 }} />
                                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1, letterSpacing: 1, textTransform: 'uppercase' }}>
                                                Reasons for Detected Crime
                                            </Typography>
                                            <List dense>
                                                {reasons.length > 0 ? reasons.map(([k, v], i) => (
                                                    <ListItem key={k}>
                                                        <ListItemText primary={`${i + 1}. ${k}`} secondary={`Incidents: ${v}`} />
                                                    </ListItem>
                                                )) : <ListItem><ListItemText primary="No significant crime reasons reported." /></ListItem>}
                                            </List>
                                            <Divider sx={{ my: 2 }} />
                                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'error.main', mb: 1, letterSpacing: 1, textTransform: 'uppercase' }}>
                                                Total Detected Crime
                                            </Typography>
                                            <Typography variant="h5" color="error" gutterBottom>{crime}</Typography>
                                            <Divider sx={{ my: 2 }} />
                                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'secondary.main', mb: 1, letterSpacing: 1, textTransform: 'uppercase' }}>
                                                Metadata
                                            </Typography>
                                            <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', rowGap: 1, columnGap: 2, alignItems: 'center', mt: 1, mb: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                                                <HomeWork color="primary" sx={{ mr: 1 }} />
                                                <Typography variant="body2"><b>Council:</b> {council}</Typography>
                                                <Group color="action" sx={{ mr: 1 }} />
                                                <Typography variant="body2"><b>Population:</b> {population?.toLocaleString()}</Typography>
                                                <Engineering color="secondary" sx={{ mr: 1 }} />
                                                <Typography variant="body2"><b>Area:</b> {area} km²</Typography>
                                                <MoodBad color="error" sx={{ mr: 1 }} />
                                                <Typography variant="body2"><b>Negative Sentiment:</b> {entry['neg_ratio']}</Typography>
                                            </Box>
                                        </>
                                    );
                                })()}
                            </Card>
                        </Box>
                    </Box>
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