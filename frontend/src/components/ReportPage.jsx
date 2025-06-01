import React, { useState } from 'react';
import {
    Box, Paper, Typography, TextField, Button, Stack, Stepper, Step, StepLabel, CircularProgress, Card, Divider, MenuItem, Snackbar, LinearProgress
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Map as MapIcon, Assessment as AssessmentIcon, Email as EmailIcon, Warning as WarningIcon } from '@mui/icons-material';

const REPORT_TYPES = [
    { value: 'hotspot', label: 'Hotspot Forecast', desc: 'Predicts the most likely crime hotspots for the selected week.' },
    { value: 'trend', label: 'Trend Analysis', desc: 'Analyzes crime trends and patterns for the upcoming week.' },
    { value: 'overview', label: 'Scotland Overview', desc: 'Provides an overall summary of crime statistics and trends across Scotland for the selected period.' }
];

const SEVERITY_LEVELS = [
    { value: 1, label: 'Low', desc: 'Only show areas with low predicted severity.' },
    { value: 2, label: 'Medium', desc: 'Show areas with medium or higher predicted severity.' },
    { value: 3, label: 'High', desc: 'Only show areas with high predicted severity.' }
];

const LOADING_STEPS = [
    'Collecting historical data...',
    'Training on historical data...',
    'Forecasting hotspots...',
    'Generating summary...'
];

function getFormSteps({ date, setDate, reportType, setReportType, severity, setSeverity, email, setEmail }) {
    return [
        {
            label: 'Select Forecast Start Month',
            content: (
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                        label="Forecast Start Month"
                        views={['year', 'month']}
                        value={date}
                        onChange={val => setDate(val)}
                        minDate={new Date(2019, 3)}
                        maxDate={new Date(2024, 11)}
                        slotProps={{ textField: { fullWidth: true } }}
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
            label: 'Set Severity Threshold',
            content: (
                <Box>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                        Severity Threshold controls which hotspots are included in the report:
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ overflow: 'hidden' }}>
                        {SEVERITY_LEVELS.map(opt => (
                            <Paper
                                key={opt.value}
                                elevation={severity === opt.value ? 6 : 1}
                                sx={{
                                    width: 240,
                                    minWidth: 0,
                                    p: 2,
                                    border: severity === opt.value ? '2px solid #d32f2f' : '1px solid #e0e0e0',
                                    boxShadow: severity === opt.value ? 4 : 1,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    backgroundColor: severity === opt.value ? 'rgba(211, 47, 47, 0.08)' : 'white',
                                    '&:hover': {
                                        border: '2px solid #d32f2f',
                                        backgroundColor: 'rgba(211, 47, 47, 0.04)'
                                    },
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                }}
                                onClick={() => setSeverity(opt.value)}
                            >
                                <Typography variant="subtitle1" fontWeight={600} color={severity === opt.value ? 'error' : 'text.primary'}>
                                    {opt.label}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">{opt.desc}</Typography>
                            </Paper>
                        ))}
                    </Stack>
                </Box>
            ),
            isValid: !!severity
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
    const [date, setDate] = useState(new Date(2024, 6)); // July 2024
    const [reportType, setReportType] = useState('hotspot');
    const [severity, setSeverity] = useState(3);
    const [email, setEmail] = useState('');
    const [formStep, setFormStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const [finished, setFinished] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    const formSteps = getFormSteps({ date, setDate, reportType, setReportType, severity, setSeverity, email, setEmail });

    // Progress for form and loading
    const formProgress = Math.round((formStep / formSteps.length) * 100);
    const loadingProgress = Math.round((loadingStep / LOADING_STEPS.length) * 100);

    // Simulate loading steps
    const startLoading = () => {
        setLoading(true);
        setLoadingStep(0);
        setFinished(false);
        let step = 0;
        const interval = setInterval(() => {
            step++;
            if (step < LOADING_STEPS.length) {
                setLoadingStep(step);
            } else {
                clearInterval(interval);
                setTimeout(() => {
                    setLoading(false);
                    setFinished(true);
                    setSnackbarOpen(true);
                }, 1200);
            }
        }, 3000);
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
        setDate(new Date(2024, 6));
        setReportType('hotspot');
        setSeverity(2);
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
                        {/* Placeholder for Map */}
                        <Box sx={{ flex: 1, minHeight: 320, bgcolor: '#f5f5f5', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MapIcon sx={{ fontSize: 80, color: 'grey.400' }} />
                            <Typography variant="subtitle1" color="text.secondary" sx={{ ml: 2 }}>
                                Map of predicted hotspots will appear here.
                            </Typography>
                        </Box>
                        {/* Placeholder for Report Summary */}
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" gutterBottom>Summary</Typography>
                            <Typography variant="body1" color="text.secondary">
                                The model predicts several hotspot areas for the week following your selected date. Detailed report and map will be available here once the backend is connected.
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="body2" color="text.secondary">
                                <b>Region:</b> All of Scotland<br />
                                <b>Start Month:</b> {date ? date.toLocaleString('default', { month: 'long', year: 'numeric' }) : 'N/A'}<br />
                                <b>Report Type:</b> {REPORT_TYPES.find(r => r.value === reportType)?.label}<br />
                                <b>Severity Threshold:</b> {SEVERITY_LEVELS.find(s => s.value === severity)?.label}<br />
                                <b>Email:</b> {email ? email : 'Not provided'}
                            </Typography>
                            <Button variant="outlined" sx={{ mt: 3 }} onClick={handleReset}>Generate Another Report</Button>
                        </Box>
                    </Box>
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
