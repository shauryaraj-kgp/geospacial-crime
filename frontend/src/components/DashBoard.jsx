import React, { useState, useEffect } from 'react';
import '../styles/DashBoard.css';
import {
    Box, Paper, Typography, Tabs, Tab, TextField,
    Button, Chip, Divider, InputAdornment, CircularProgress, Card, Snackbar, Autocomplete, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText
} from '@mui/material';
import { LocationOn, HomeWork, Group, Engineering } from '@mui/icons-material';
import { LineChart } from '@mui/x-charts';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import dayjs from 'dayjs';
import {
    fetchAllRegions,
    fetchRegionMetadata,
    fetchMonthlyCrime,
    fetchMonthlySentiment,
    fetchWeeklyCrime,
    fetchWeeklySentiment,
    fetchCrimeRank,
    fetchSentimentRank,
    fetchCrimeTotals,
    fetchSentimentTotals,
    fetchCrimeTotal,
    fetchSentimentTotal,
    fetchCrimeReasons,
    fetchWardMappings,
} from '../api';

const TimeSeriesChartComponent = React.memo(({ data, xAxis, series, height = 220, title }) => (
    <Paper sx={{ p: 3, mb: 3, boxShadow: 5 }}>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <LineChart
            height={height}
            xAxis={[xAxis]}
            yAxis={[{ label: series.label }]}
            series={[{
                data: data,
                ...series
            }]}
            tooltip={{ trigger: 'axis' }}
        />
    </Paper>
));

const DashBoardComponent = () => {
    const [allRegions, setAllRegions] = useState([]);
    const [selectedRegion, setSelectedRegion] = useState(null);
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [locationQuery, setLocationQuery] = useState('');
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [tempDate, setTempDate] = useState(dayjs('2024-12-01'));
    const [isLoading, setIsLoading] = useState(false);
    const [regionMeta, setRegionMeta] = useState(null);
    const [monthlyCrime, setMonthlyCrime] = useState([]);
    const [monthlySentiment, setMonthlySentiment] = useState([]);
    const [weeklyCrime, setWeeklyCrime] = useState([]);
    const [weeklySentiment, setWeeklySentiment] = useState([]);
    const [crimeRank, setCrimeRank] = useState(null);
    const [sentimentRank, setSentimentRank] = useState(null);
    const [totalRegions, setTotalRegions] = useState(null);
    const [totalCrime, setTotalCrime] = useState(null);
    const [totalSentiment, setTotalSentiment] = useState(null);
    const [crimeReasons, setCrimeReasons] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [backendReady, setBackendReady] = useState(false);
    const [wardCodeMapping, setWardCodeMapping] = useState({});
    const [selectedWardCode, setSelectedWardCode] = useState(null);
    const [wardMappings, setWardMappings] = useState([]);
    const [allSourceLocations, setAllSourceLocations] = useState([]);
    const [selectedSourceLocation, setSelectedSourceLocation] = useState(null);

    useEffect(() => {
        fetchWardMappings()
            .then((mappings) => {
                setWardMappings(mappings);
                setAllSourceLocations(mappings.map(m => m.source_location));
                setBackendReady(true);
            })
            .catch(() => setAllSourceLocations([]))
            .finally(() => setBackendReady(true));
    }, []);

    useEffect(() => {
        if (!selectedWardCode) return;
        setIsLoading(true);
        Promise.all([
            fetchRegionMetadata(selectedWardCode)
        ]).then(([metadata]) => {
            console.log('Fetched metadata for ward:', selectedWardCode, metadata);
            setRegionMeta(metadata);
        }).catch(error => {
            console.error('Error fetching metadata for ward:', selectedWardCode, error);
            setRegionMeta(null);
        }).finally(() => setIsLoading(false));
    }, [selectedWardCode]);

    useEffect(() => {
        if (!selectedWardCode || !selectedYear) return;
        setIsLoading(true);
        Promise.all([
            fetchMonthlyCrime(selectedYear, selectedWardCode),
            fetchMonthlySentiment(selectedYear, selectedWardCode)
        ]).then(([crime, sentiment]) => {
            setMonthlyCrime(Array.from({ length: 12 }, (_, i) => crime[String(i + 1)] || 0));
            setMonthlySentiment(Array.from({ length: 12 }, (_, i) => sentiment[String(i + 1)] || 0));
        }).finally(() => setIsLoading(false));
    }, [selectedWardCode, selectedYear]);

    useEffect(() => {
        if (!selectedWardCode || !selectedYear || !selectedMonth) return;
        setIsLoading(true);
        Promise.all([
            fetchWeeklyCrime(selectedYear, selectedMonth, selectedWardCode),
            fetchWeeklySentiment(selectedYear, selectedMonth, selectedWardCode)
        ]).then(([crime, sentiment]) => {
            setWeeklyCrime(crime.map(d => d.detected_crime));
            setWeeklySentiment(sentiment.map(d => d.sentiment));
        }).finally(() => setIsLoading(false));
    }, [selectedWardCode, selectedYear, selectedMonth]);

    useEffect(() => {
        if (!selectedWardCode || !selectedYear || !selectedMonth) return;
        setIsLoading(true);
        Promise.all([
            fetchCrimeRank(selectedYear, selectedMonth, selectedWardCode),
            fetchSentimentRank(selectedYear, selectedMonth, selectedWardCode),
            fetchCrimeTotals(selectedYear, selectedMonth),
            fetchSentimentTotals(selectedYear, selectedMonth),
            fetchCrimeTotal(selectedYear, selectedMonth, selectedWardCode),
            fetchSentimentTotal(selectedYear, selectedMonth, selectedWardCode)
        ]).then(([crimeRank, sentimentRank, crimeAll, sentimentAll, crimeTotal, sentimentTotal]) => {
            setCrimeRank(crimeRank.rank);
            setSentimentRank(sentimentRank.rank);
            setTotalRegions(crimeRank.total_regions);
            setTotalCrime(crimeTotal.total_detected_crime);
            setTotalSentiment(sentimentTotal.average_sentiment);
        }).finally(() => setIsLoading(false));
    }, [selectedWardCode, selectedYear, selectedMonth]);

    useEffect(() => {
        if (!selectedWardCode || !selectedYear || !selectedMonth) return;
        setIsLoading(true);
        fetchCrimeReasons(selectedYear, selectedMonth, selectedWardCode)
            .then(data => setCrimeReasons(Object.entries(data)))
            .finally(() => setIsLoading(false));
    }, [selectedWardCode, selectedYear, selectedMonth]);

    useEffect(() => {
        // Add mapping between source_location and ward_code
        const mapping = {};
        allRegions.forEach(region => {
            mapping[region] = region.replace(/\s+/g, '_').toUpperCase();
        });
        setWardCodeMapping(mapping);
    }, [allRegions]);

    const handleSearchLocation = (query) => {
        if (!allSourceLocations.includes(query)) {
            setSnackbar({ open: true, message: "Please select a valid location from the list.", severity: 'warning' });
            return false;
        }
        return true;
    };

    const handleSelectLocation = (sourceLocation) => {
        setSelectedSourceLocation(sourceLocation);
        const mapping = wardMappings.find(m => m.source_location === sourceLocation);
        setSelectedWardCode(mapping ? mapping.ward_code : null);
    };

    return (
        <>
            {!backendReady && (
                <Box sx={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(255,255,255,0.95)', zIndex: 99999,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}>
                    <CircularProgress size={60} thickness={4} />
                    <Typography variant="h5" sx={{ mt: 3, color: 'primary.main', fontWeight: 600 }}>
                        We are loading the dataset on the backend...
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
                        This might take some time on the first load.
                    </Typography>
                </Box>
            )}

            {backendReady && (
                <div className="dashboard-wrapper">
                    {isLoading && (
                        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', transition: 'all 0.2s ease-in-out' }}>
                            <CircularProgress size={60} thickness={4} />
                            <Typography variant="h6" sx={{ mt: 2, color: 'primary.main', fontWeight: 500 }}>Processing Data...</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Please wait while we update the dashboard</Typography>
                        </Box>
                    )}
                    <div className="dashboard">
                        <header className="dashboard-header">
                            <h1>Scotland Crime Data Statistics</h1>
                            <p>This dashboard provides a comprehensive view of detected crime trends and public sentiment across Scotland. Use the tools below to explore regional patterns and visualize geographic hotspots.</p>
                        </header>
                        <Paper sx={{ p: 3, mb: 3, boxShadow: 5 }}>
                            <Typography variant="h6" gutterBottom>Search Location</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Enter a location to see its crime statistics</Typography>
                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                <Autocomplete
                                    freeSolo
                                    options={allSourceLocations}
                                    inputValue={locationQuery}
                                    onInputChange={(event, newInputValue) => setLocationQuery(newInputValue)}
                                    onChange={(event, newValue) => {
                                        if (newValue && handleSearchLocation(newValue)) {
                                            handleSelectLocation(newValue);
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
                                    onClick={() => {
                                        if (handleSearchLocation(locationQuery)) {
                                            handleSelectLocation(locationQuery);
                                        }
                                    }}
                                    sx={{ px: 4, fontSize: 15 }}
                                >
                                    Search
                                </Button>
                            </Box>
                        </Paper>
                        {selectedSourceLocation && locationQuery && (
                            <Box textAlign="center" sx={{ mb: 4 }}>
                                <Button
                                    variant="outlined"
                                    onClick={() => setCalendarOpen(true)}
                                    sx={{ fontSize: 16, px: 4 }}
                                >
                                    {(selectedYear && selectedMonth) ?
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
                                <Button onClick={() => setCalendarOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={() => {
                                        setSelectedYear(tempDate.year());
                                        setSelectedMonth(tempDate.month() + 1);
                                        setCalendarOpen(false);
                                    }}
                                >
                                    Confirm
                                </Button>
                            </DialogActions>
                        </Dialog>
                        {selectedSourceLocation && locationQuery && selectedMonth && selectedYear && (
                            <Box className="dashboard-main" sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
                                <Box sx={{ flex: 0.7, minWidth: 0 }}>
                                    <TimeSeriesChartComponent
                                        data={monthlyCrime}
                                        xAxis={{
                                            data: Array.from({ length: 12 }, (_, i) => i + 1),
                                            valueFormatter: (value) => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][value - 1],
                                            label: 'Month',
                                        }}
                                        series={{
                                            label: 'Detected Crime',
                                            color: '#ff4d4f',
                                            curve: 'monotone',
                                            area: true,
                                        }}
                                        height={220}
                                        title="Monthly Crime Distribution"
                                    />
                                    <TimeSeriesChartComponent
                                        data={weeklyCrime}
                                        xAxis={{
                                            data: weeklyCrime.map((_, index) => index + 1),
                                            valueFormatter: (value) => `Week ${value}`,
                                            label: 'Week of Month',
                                        }}
                                        series={{
                                            label: 'Detected Crime',
                                            color: '#ff4d4f',
                                            curve: 'monotone',
                                            area: true,
                                            showMark: true,
                                        }}
                                        height={220}
                                        title="Weekly Crime Distribution"
                                    />
                                    <TimeSeriesChartComponent
                                        data={monthlySentiment}
                                        xAxis={{
                                            data: Array.from({ length: 12 }, (_, i) => i + 1),
                                            valueFormatter: (value) => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][value - 1],
                                            label: 'Month',
                                        }}
                                        series={{
                                            label: 'Weighted Sentiment',
                                            color: '#52c41a',
                                            curve: 'monotone',
                                            area: true,
                                        }}
                                        height={220}
                                        title="Monthly Sentiment Distribution"
                                    />
                                    <TimeSeriesChartComponent
                                        data={weeklySentiment}
                                        xAxis={{
                                            data: weeklySentiment.map((_, index) => index + 1),
                                            valueFormatter: (value) => `Week ${value}`,
                                            label: 'Week of Month',
                                        }}
                                        series={{
                                            label: 'Weighted Sentiment',
                                            color: '#52c41a',
                                            curve: 'monotone',
                                            area: true,
                                            showMark: true,
                                        }}
                                        height={220}
                                        title="Weekly Sentiment Distribution"
                                    />
                                </Box>
                                <Box sx={{ flex: 0.3, minWidth: 0, mb: 5 }}>
                                    <Card sx={{ height: '100%', overflow: 'auto', p: 2 }}>
                                        <Tabs value={0} variant="fullWidth" sx={{ mb: 2 }}>
                                            <Tab label="Region Details" />
                                        </Tabs>
                                        <Typography variant="h5" gutterBottom>{selectedSourceLocation}</Typography>
                                        <Box sx={{ mb: 3 }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                                Rankings based on {totalRegions} regions across Scotland
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
                                                <Box sx={{ textAlign: 'center', minWidth: '120px', p: 1.5, borderRadius: 2, bgcolor: 'rgba(25, 118, 210, 0.05)', border: '1px solid rgba(25, 118, 210, 0.1)' }}>
                                                    <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', fontSize: 32, mb: 0.5 }}>
                                                        #{crimeRank}
                                                    </Typography>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 500, color: 'primary.main', letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.8rem' }}>
                                                        Crime Rank
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ textAlign: 'center', minWidth: '120px', p: 1.5, borderRadius: 2, bgcolor: 'rgba(156, 39, 176, 0.05)', border: '1px solid rgba(156, 39, 176, 0.1)' }}>
                                                    <Typography variant="h6" color="secondary" sx={{ fontWeight: 'bold', fontSize: 32, mb: 0.5 }}>
                                                        #{sentimentRank}
                                                    </Typography>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 500, color: 'secondary.main', letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.8rem' }}>
                                                        Sentiment Rank
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Box sx={{ mt: 2 }}>
                                                <Chip
                                                    label={(() => {
                                                        if (crimeRank <= 30) return 'High Crime Rate';
                                                        if (crimeRank <= 75) return 'Relatively High Crime';
                                                        if (crimeRank <= 150) return 'Relatively Safe';
                                                        return 'Safe';
                                                    })()}
                                                    color={(() => {
                                                        if (crimeRank <= 30) return 'error';
                                                        if (crimeRank <= 75) return 'warning';
                                                        if (crimeRank <= 150) return 'info';
                                                        return 'success';
                                                    })()}
                                                    sx={{ px: 2, py: 1, fontWeight: 'bold', fontFamily: 'monospace', fontSize: 22 }}
                                                />
                                                <Typography variant="body2" sx={{ mt: 1 }}>
                                                    {crimeRank >= 151 && 'This region is considered safe.'}
                                                    {crimeRank >= 76 && crimeRank <= 150 && 'This region is relatively safe.'}
                                                    {crimeRank >= 31 && crimeRank <= 75 && 'This region has a moderately high crime rate.'}
                                                    {crimeRank >= 1 && crimeRank <= 30 && 'This region has a high crime rate this month.'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Divider sx={{ my: 2 }} />
                                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1, letterSpacing: 1, textTransform: 'uppercase' }}>
                                            Reasons for Detected Crime
                                        </Typography>
                                        <List dense>
                                            {crimeReasons.length > 0 ? crimeReasons.map(([k, v], i) => (
                                                <ListItem key={k}>
                                                    <ListItemText primary={`${i + 1}. ${k}`} secondary={`Incidents: ${v}`} />
                                                </ListItem>
                                            )) : <ListItem><ListItemText primary="No significant crime reasons reported." /></ListItem>}
                                        </List>
                                        <Divider sx={{ my: 2 }} />
                                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'error.main', mb: 1, letterSpacing: 1, textTransform: 'uppercase' }}>
                                            Total Detected Crime
                                        </Typography>
                                        <Typography variant="h5" color="error" gutterBottom>{totalCrime}</Typography>
                                        <Divider sx={{ my: 2 }} />
                                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'secondary.main', mb: 1, letterSpacing: 1, textTransform: 'uppercase' }}>
                                            Metadata
                                        </Typography>
                                        {regionMeta && (
                                            <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', rowGap: 1, columnGap: 2, alignItems: 'center', mt: 1, mb: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                                                <HomeWork color="primary" sx={{ mr: 1 }} />
                                                <Typography variant="body2"><b>Council:</b> {regionMeta.council}</Typography>
                                                <Group color="action" sx={{ mr: 1 }} />
                                                <Typography variant="body2"><b>Population:</b> {regionMeta.population?.toLocaleString()}</Typography>
                                                <Engineering color="secondary" sx={{ mr: 1 }} />
                                                <Typography variant="body2"><b>Area:</b> {regionMeta.area} km²</Typography>
                                            </Box>
                                        )}
                                    </Card>
                                </Box>
                            </Box>
                        )}
                    </div>
                    <Snackbar
                        open={snackbar.open}
                        autoHideDuration={3000}
                        onClose={() => setSnackbar({ ...snackbar, open: false })}
                        message={snackbar.message}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    />
                </div>
            )}
        </>
    );
};

export default React.memo(DashBoardComponent);