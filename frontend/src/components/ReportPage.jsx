import React, { useRef, useState, useEffect } from 'react';
import {
    Box, Paper, Typography, TextField, Button, Stack, IconButton, Stepper, Step, StepLabel, CircularProgress, Card, Divider, MenuItem, Snackbar, LinearProgress,
    Autocomplete, List, ListItem, ListItemText, CardContent, Tab
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Map as MapGL, NavigationControl, Popup, Marker, ScaleControl, Source, Layer } from 'react-map-gl/maplibre';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { fetchHotspotSummary, fetchWardLatLon } from '../api';
import '../styles/ReportPage.css';
import {
    Map as MapIcon, Assessment as AssessmentIcon, Email as EmailIcon,
    Search as SearchIcon,
    Refresh as RefreshIcon,
    MyLocation as MyLocationIcon,
    Info as InfoIcon,
    Download as DownloadIcon,
    Share as ShareIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';

const REPORT_TYPES = [
    { value: 'hotspot', label: 'Hotspot Forecast', desc: 'Predicts the most likely crime hotspots for the selected week.' },
    { value: 'trend', label: 'Trend Analysis', desc: 'Analyzes crime trends and patterns for the upcoming week.' },
    { value: 'overview', label: 'Scotland Overview', desc: 'Provides an overall summary of crime statistics and trends across Scotland for the selected period.' }
];


const LOADING_STEPS = [
    'Collecting historical data...',
    'Training on historical data...',
    'Forecasting hotspots...',
    'Generating summary...'
];

function getFormSteps({ date, setDate, reportType, setReportType, email, setEmail }) {
    return [
        {
            label: 'Select Forecast Start Date',
            content: (
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                        label="Forecast Start Date"
                        views={['year', 'month', 'day']}
                        value={date}
                        onChange={val => setDate(val)}
                        minDate={new Date(2019, 3)}
                        maxDate={new Date(2024, 11)}
                        slotProps={{
                            textField: {
                                fullWidth: true,
                                inputProps: {
                                    placeholder: 'DD/MM/YYYY'
                                }
                            }
                        }}
                        format="dd/MM/yyyy"
                    />
                </LocalizationProvider>
            ),
            isValid: !!date
        },
        {
            label: 'Choose Report Type',
            content: (
                <Box>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                        Report Type determines the kind of analysis you want:
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ overflow: 'hidden' }}>
                        {REPORT_TYPES.map(opt => (
                            <Paper
                                key={opt.value}
                                elevation={reportType === opt.value ? 6 : 1}
                                sx={{
                                    width: 300,
                                    minWidth: 0,
                                    p: 2,
                                    border: reportType === opt.value ? '2px solid #1976d2' : '1px solid #e0e0e0',
                                    boxShadow: reportType === opt.value ? 4 : 1,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    backgroundColor: reportType === opt.value ? 'rgba(25, 118, 210, 0.08)' : 'white',
                                    '&:hover': {
                                        border: '2px solid #1976d2',
                                        backgroundColor: 'rgba(25, 118, 210, 0.04)'
                                    },
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                }}
                                onClick={() => setReportType(opt.value)}
                            >
                                <Typography variant="subtitle1" fontWeight={600} color={reportType === opt.value ? 'primary' : 'text.primary'}>
                                    {opt.label}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">{opt.desc}</Typography>
                            </Paper>
                        ))}
                    </Stack>
                </Box>
            ),
            isValid: !!reportType
        },
        {
            label: 'Enter Email for Report Delivery (optional)',
            content: (
                <TextField
                    label="Email for Report Delivery (optional)"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    type="email"
                    fullWidth
                    InputProps={{ startAdornment: <EmailIcon sx={{ mr: 1 }} /> }}
                    autoFocus
                />
            ),
            isValid: true // Always valid, email is optional
        }
    ];
}

export default function ReportPage() {
    const [date, setDate] = useState(new Date(2024, 6, 29)); // July 29, 2024
    const [reportType, setReportType] = useState('hotspot');
    const [email, setEmail] = useState('');
    const [formStep, setFormStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const [finished, setFinished] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [hotspots, setHotspots] = useState([]);
    const [summary, setSummary] = useState('');
    const [error, setError] = useState(null);
    const [hotspotLocations, setHotspotLocations] = useState([]); // [{ward, council, lat, lon}]
    const [popupInfo, setPopupInfo] = useState(null);
    const [viewState, setViewState] = useState({
        longitude: -4.2026,
        latitude: 57.4907,
        zoom: 6,
        bearing: 0,
        pitch: 0
    });
    const [geoData, setGeoData] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [selectedWardCode, setSelectedWardCode] = useState(null);
    const [selectedLatLon, setSelectedLatLon] = useState(null);
    const mapRef = useRef(null);

    const formSteps = getFormSteps({ date, setDate, reportType, setReportType, email, setEmail });

    // Progress for form and loading
    const formProgress = Math.round((formStep / formSteps.length) * 100);
    const loadingProgress = Math.round((loadingStep / LOADING_STEPS.length) * 100);

    // Place this after hotspotLocations is defined
    const hotspotNames = hotspotLocations.map(h => h.location);
    const layerStyle = {
        id: 'scotland-regions-layer-2',
        type: 'fill',
        paint: {
            'fill-color': [
                'match',
                ['get', 'WD13NM'],
                ...hotspotNames.reduce((arr, name) => arr.concat([name, '#f44336']), []), // MUI red[500]
                '#e0e0e0' // MUI grey[300] for non-hotspots
            ],
            'fill-opacity': 0.7,
            'fill-outline-color': '#666666'
        }
    };

    // Simulate loading steps and call backend
    const startLoading = async () => {
        setLoading(true);
        setLoadingStep(0);
        setFinished(false);
        setError(null);
        setHotspotLocations([]);
        setPopupInfo(null);
        let step = 0;
        const interval = setInterval(() => {
            step++;
            if (step < LOADING_STEPS.length) {
                setLoadingStep(step);
            } else {
                clearInterval(interval);
            }
        }, 30000);

        try {
            const result = await fetchHotspotSummary();
            setHotspots(result.hotspots || []);
            setSummary(result.summary || '');

            // Fetch lat/lon for each hotspot
            if (result.hotspots && result.hotspots.length > 0) {
                const locs = await Promise.all(result.hotspots.map(async (h) => {
                    try {
                        const latlon = await fetchWardLatLon(h.ward);
                        return {
                            location: h.source_location,
                            ward: h.ward,
                            council: h.council,
                            lat: latlon.latitude,
                            lon: latlon.longitude
                        };
                    } catch {
                        return null;
                    }
                }));
                setHotspotLocations(locs.filter(Boolean));
            }
        } catch (err) {
            setError('Failed to generate report. Please try again.');
        } finally {
            setLoading(false);
            setFinished(true);
            setSnackbarOpen(true);
        }
    };

    const handleNext = () => {
        if (formStep < formSteps.length - 1) {
            setFormStep(formStep + 1);
        } else {
            startLoading();
        }
    };

    const handleBack = () => {
        if (formStep > 0) setFormStep(formStep - 1);
    };

    // Reset for new report
    const handleReset = () => {
        setFormStep(0);
        setLoading(false);
        setLoadingStep(0);
        setFinished(false);
        setSnackbarOpen(false);
        setDate(new Date(2024, 6, 29));
        setReportType('hotspot');
        setEmail('');
    };


    const handleSelectLocation = async (sourceLocation) => {
        setSelectedLocation(sourceLocation);
        const mapping = hotspotLocations.find(m => m.location === sourceLocation);
        if (mapping) {
            setSelectedWardCode(mapping.ward);
            setSelectedLatLon({ latitude: mapping.lat, longitude: mapping.lon });
            flyToLocation(mapping.lon, mapping.lat, 10);
            setPopupInfo({
                longitude: mapping.lon,
                latitude: mapping.lat,
                label: sourceLocation,
                council: mapping.council
            });
        } else {
            setSelectedWardCode(null);
            setSelectedLatLon(null);
        }
    };

    const flyToLocation = (longitude, latitude, zoom) => {
        const map = mapRef.current?.getMap?.();
        if (map) {
            map.flyTo({
                center: [longitude, latitude],
                zoom: zoom,
                speed: 1.2,
                curve: 1.42,
                essential: true
            });
        } else {
            setViewState(vs => ({ ...vs, longitude, latitude, zoom }));
        }
    };

    // Fetch GeoJSON file once
    useEffect(() => {
        fetch('/data/scotland-geodata.json')
            .then((res) => res.json())
            .then((data) => {
                setGeoData(data);
            })
            .catch((err) => {
                console.error('Failed to load geoData:', err);
            });
    }, []);

    const handleMapClick = (event) => {
        if (event.features && event.features.length > 0) {
            const feature = event.features[0];
            const properties = feature.properties || {};
            const regionName = properties.WD13NM;
            // Try to find council from geoData or hotspotLocations
            let council = '';
            const match = hotspotLocations.find(h => h.location === regionName);
            if (match) council = match.council;
            setPopupInfo({
                longitude: event.lngLat.lng,
                latitude: event.lngLat.lat,
                label: regionName,
                council
            });
        } else {
            setPopupInfo(null);
        }
    };

    function renderGeminiSummary(summary) {
        // Split on ** and alternate between normal and bold
        const parts = summary.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, idx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={idx}>{part.slice(2, -2)}</strong>;
            }
            return <span key={idx}>{part}</span>;
        });
    }

    return (
        <Box sx={{ p: 4, mx: 'auto', minHeight: '100vh' }}>
            <Paper sx={{ p: 4, mb: 4, boxShadow: 5 }}>
                <Typography variant="h4" gutterBottom>Generate Hotspot Report</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    Generate a predictive report for crime hotspots across Scotland in the upcoming week. The model will analyze historical data and forecast the most likely areas of concern. Select your preferences below.
                </Typography>
                {/* Progress Bar for Form */}
                <Box sx={{ mb: 3 }}>
                    <LinearProgress
                        variant="determinate"
                        value={loading || finished ? 100 : formProgress}
                        sx={{ height: 10, borderRadius: 2 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'right' }}>
                        Step {(loading || finished) ? formSteps.length : formStep + 1} of {formSteps.length}
                    </Typography>
                </Box>
                {/* Stepper-like Form */}
                <Box sx={{ minHeight: 120 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>{formSteps[formStep].label}</Typography>
                    {formSteps[formStep].content}
                </Box>
                {/* Navigation Buttons */}
                <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                    {formStep > 0 && (
                        <Button variant="outlined" onClick={handleBack} disabled={loading}>Back</Button>
                    )}
                    <Box sx={{ flexGrow: 1 }} />
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleNext}
                        disabled={loading || !formSteps[formStep].isValid}
                        startIcon={formStep === formSteps.length - 1 ? <AssessmentIcon /> : null}
                    >
                        {formStep === formSteps.length - 1 ? 'Generate Report' : 'Next'}
                    </Button>
                </Stack>
            </Paper>

            {/* Loading Progress Bar */}
            {loading && (
                <Card sx={{ p: 4, mb: 4, textAlign: 'center', boxShadow: 3, mx: 'auto', background: 'white' }}>
                    <Box sx={{ minHeight: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                        <Typography variant="h6" color="text.primary" sx={{ mb: 1, fontWeight: 500 }}>
                            {LOADING_STEPS[loadingStep]}
                        </Typography>
                    </Box>
                    <Box>
                        <LinearProgress variant="determinate" value={loadingProgress} sx={{ height: 8, borderRadius: 2 }} />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'right' }}>
                            Step {loadingStep + 1} of {LOADING_STEPS.length}
                        </Typography>
                    </Box>
                </Card>
            )}

            {/* Final Report Section */}
            {finished && (
                <>
                    <Box sx={{ display: 'flex', flex: 1, gap: 2, height: '700px' }}>
                        <Box sx={{ width: '70%', position: 'relative', height: '700px' }}>

                            <Box
                                component="form"
                                sx={{
                                    display: 'flex',
                                    gap: 2,
                                    width: '100%',
                                    alignItems: 'center',
                                    mb: 2,
                                    height: '52px'
                                }}
                                onSubmit={(e) => e.preventDefault()}
                            >
                                <Autocomplete
                                    fullWidth
                                    options={hotspotLocations.map(h => h.location)}
                                    value={selectedLocation}
                                    onChange={(_, newValue) => handleSelectLocation(newValue)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            placeholder="Search Hotspot Areas..."
                                            size="small"
                                            InputProps={{
                                                ...params.InputProps,
                                                startAdornment: (
                                                    <>
                                                        <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                                        {params.InputProps.startAdornment}
                                                    </>
                                                )
                                            }}
                                        />
                                    )}
                                />

                                <Stack direction="row" spacing={1}>
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            setSelectedWardCode(null);
                                            flyToLocation(-4.2026, 57.4907, 5);
                                        }}>
                                        <RefreshIcon />
                                    </IconButton>
                                    <IconButton size="small"><MyLocationIcon /></IconButton>
                                    <IconButton size="small"><InfoIcon /></IconButton>
                                    <IconButton size="small"><DownloadIcon /></IconButton>
                                    <IconButton size="small"><ShareIcon /></IconButton>
                                </Stack>
                            </Box>

                            <Box sx={{ width: '100%', height: '500px', position: 'relative' }}>
                                <MapGL
                                    ref={mapRef}
                                    mapLib={maplibregl}
                                    {...viewState}
                                    onMove={evt => setViewState(evt.viewState)}
                                    style={{ width: '100%', height: '100%' }}
                                    mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
                                    interactiveLayerIds={['scotland-regions-layer-2']}
                                    cursor={selectedWardCode ? 'pointer' : 'default'}
                                    onClick={handleMapClick}
                                >
                                    <NavigationControl position="bottom-right" />
                                    <ScaleControl position="bottom-left" />

                                    {geoData && (
                                        <Source type="geojson" data={geoData}>
                                            <Layer {...layerStyle} />
                                        </Source>
                                    )}
                                    {popupInfo && (
                                        <Popup
                                            longitude={popupInfo.longitude}
                                            latitude={popupInfo.latitude}
                                            closeButton={true}
                                            closeOnClick={false}
                                            onClose={() => setPopupInfo(null)}
                                        >
                                            <div>
                                                <strong>{popupInfo.label}</strong><br />
                                                <strong>{popupInfo.council}</strong><br />
                                            </div>
                                        </Popup>
                                    )}
                                </MapGL>
                            </Box>
                        </Box>


                        <Box sx={{ width: '30%', height: '565px' }}>
                            <Card sx={{ height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                                {/* Tan header outside scrollable area */}
                                <Box sx={{ p: 2, borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
                                    <Typography variant="h6" textAlign={'center'} sx={{ margin: 0.5, fontWeight: 500 }} >
                                        Hotspot Details
                                    </Typography>
                                </Box>
                                <Divider sx={{ width: 200, mx: 'auto' }} />
                                <CardContent sx={{ flex: 1, overflowY: 'auto', p: 0 }}>
                                    <List dense>
                                        {hotspotLocations.map((area, index) => (
                                            <ListItem
                                                key={area.location}
                                                button={true}
                                                onClick={() => {
                                                    handleSelectLocation(area.location);
                                                }}
                                                sx={{
                                                    backgroundColor: 'transparent',
                                                    borderRadius: 1,
                                                    mb: 0.5,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <ListItemText
                                                    primary={`${index + 1}. ${area.location}`}
                                                    secondary={`${area.council}`}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </CardContent>
                            </Card>
                        </Box>
                    </Box>

                    <Box sx={{ width: '100%' }}>
                        <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
                            <Typography variant="h5" gutterBottom>Summary Report</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>{renderGeminiSummary(summary)}</Typography>
                        </Paper>
                    </Box>

                    {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
                    <Button variant="outlined" sx={{ mt: 3 }} onClick={handleReset}>Generate Another Report</Button>
                </>
            )
            }

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                onClose={() => setSnackbarOpen(false)}
                message="Report generated!"
            />
        </Box >
    );
}
