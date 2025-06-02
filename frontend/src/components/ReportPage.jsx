import React, { useState } from 'react';
import {
    Box, Paper, Typography, TextField, Button, Stack, Stepper, Step, StepLabel, CircularProgress, Card, Divider, MenuItem, Snackbar, LinearProgress
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Map as MapIcon, Assessment as AssessmentIcon, Email as EmailIcon, Warning as WarningIcon } from '@mui/icons-material';
import { Map as MapGL, NavigationControl, Popup, Marker } from 'react-map-gl/maplibre';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { fetchHotspotSummary, fetchWardLatLon } from '../api';

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
    const [mapView, setMapView] = useState({
        longitude: -4.2026,
        latitude: 57.4907,
        zoom: 6,
        bearing: 0,
        pitch: 0
    });

    const formSteps = getFormSteps({ date, setDate, reportType, setReportType, email, setEmail });

    // Progress for form and loading
    const formProgress = Math.round((formStep / formSteps.length) * 100);
    const loadingProgress = Math.round((loadingStep / LOADING_STEPS.length) * 100);

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
        }, 10000);
        try {
            const result = await fetchHotspotSummary();
            setHotspots(result.hotspots || []);
            setSummary(result.summary || '');
            // Fetch lat/lon for each hotspot
            if (result.hotspots && result.hotspots.length > 0) {
                const locs = await Promise.all(result.hotspots.map(async (h) => {
                    try {
                        const latlon = await fetchWardLatLon(h.source_location);
                        return {
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

    return (
        <Box sx={{ p: 4, mx: 'auto' }}>
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
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
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
                <Card sx={{ p: 4, mb: 4, boxShadow: 3, mx: 'auto', background: 'rgba(255,255,255,0.97)' }}>
                    <Typography variant="h5" gutterBottom>
                        <WarningIcon color="error" sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Hotspot Forecast for Next Week
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
                        {/* Map Area (now with MapLibre) */}
                        <Box sx={{ flex: 1, minHeight: 320, bgcolor: '#f5f5f5', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', height: 350 }}>
                            <MapGL
                                mapLib={maplibregl}
                                {...mapView}
                                onMove={evt => setMapView(evt.viewState)}
                                style={{ width: '100%', height: 320, borderRadius: 8 }}
                                mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
                            >
                                <NavigationControl position="bottom-right" />
                                {hotspotLocations.map((loc, idx) => (
                                    <Marker key={idx} longitude={loc.lon} latitude={loc.lat} anchor="bottom">
                                        <div
                                            style={{ cursor: 'pointer' }}
                                            onClick={e => {
                                                e.stopPropagation();
                                                setPopupInfo({ ...loc });
                                            }}
                                        >
                                            <svg height="32" width="32" viewBox="0 0 32 32">
                                                <circle cx="16" cy="16" r="10" fill="#1976d2" stroke="#fff" strokeWidth="2" />
                                            </svg>
                                        </div>
                                    </Marker>
                                ))}
                                {popupInfo && (
                                    <Popup
                                        longitude={popupInfo.lon}
                                        latitude={popupInfo.lat}
                                        closeButton={true}
                                        closeOnClick={false}
                                        onClose={() => setPopupInfo(null)}
                                        anchor="bottom"
                                    >
                                        <div>
                                            <strong>{popupInfo.ward}</strong><br />
                                            {popupInfo.council}
                                        </div>
                                    </Popup>
                                )}
                            </MapGL>
                            {hotspotLocations.length === 0 && (
                                <Box sx={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                                    <MapIcon sx={{ fontSize: 80, color: 'grey.400' }} />
                                    <Typography variant="subtitle1" color="text.secondary" sx={{ ml: 2 }}>
                                        Map of predicted hotspots will appear here.
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                        {/* Hotspot List */}
                        <Box sx={{ flex: 1, minHeight: 320, bgcolor: '#e3f2fd', borderRadius: 2, p: 3, boxShadow: 1 }}>
                            <Typography variant="h6" gutterBottom color="primary">Predicted Hotspots</Typography>
                            {hotspots.length === 0 ? (
                                <Typography color="text.secondary">No hotspots detected this week.</Typography>
                            ) : (
                                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                    {hotspots.map((h, idx) => (
                                        <li key={idx} style={{ marginBottom: 8 }}>
                                            <Typography variant="subtitle1" fontWeight={600} color="primary.dark">
                                                {h.ward}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {h.council}
                                            </Typography>
                                        </li>
                                    ))}
                                </Box>
                            )}
                        </Box>
                    </Box>
                    {/* Gemini Summary Below */}
                    <Divider sx={{ my: 3 }} />
                    <Box sx={{ bgcolor: '#fffde7', borderRadius: 2, p: 3, boxShadow: 0, mt: 2 }}>
                        <Typography variant="h6" gutterBottom color="secondary">Gemini AI Summary</Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                            {summary}
                        </Typography>
                    </Box>
                    {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
                    <Button variant="outlined" sx={{ mt: 3 }} onClick={handleReset}>Generate Another Report</Button>
                </Card>
            )}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                onClose={() => setSnackbarOpen(false)}
                message="Report generated! (placeholder)"
            />
        </Box>
    );
}
