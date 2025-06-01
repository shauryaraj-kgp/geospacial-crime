// import { useState, useEffect } from 'react';
// import {
//     Box, Paper, Typography, Button, Divider,
//     Stepper, Step, StepLabel, TextField, MenuItem,
//     FormControl, InputLabel, Select, SelectChangeEvent,
//     FormControlLabel, Checkbox, LinearProgress,
//     Card, CardContent, CardHeader, IconButton,
//     List, ListItem, ListItemIcon, ListItemText,
//     Accordion, AccordionSummary, AccordionDetails,
//     Alert, Snackbar, CircularProgress
// } from '@mui/material';
// import {
//     ExpandMore, Download, Print, Share, Description,
//     CloudDownload, Check, LocationOn, LocalHospital,
//     School, Home, WaterDrop, Construction, Warning
// } from '@mui/icons-material';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// // import reportService, { DisasterQuery } from '../services/reportService';
// import ReactMarkdown from 'react-markdown';
// import { format, subDays } from 'date-fns';

// // Predefined disaster options for quick selection
// const DISASTER_OPTIONS = [
//     { name: 'Sample Disaster', date: '2025-04-28', region: 'Florida' },
//     { name: 'Kerala Floods', date: '2018-08-08', region: 'Kerala, India' },
//     { name: 'Hurricane Katrina', date: '2005-08-28', region: 'New Orleans' },
//     { name: 'Custom Disaster...', date: '', region: '' }
// ];

// export default function ReportPage() {
//     const [activeStep, setActiveStep] = useState(0);
//     const [reportType, setReportType] = useState('situational');
//     const [region, setRegion] = useState('');
//     const [timeframe, setTimeframe] = useState('48h');
//     const [selectedSections, setSelectedSections] = useState([
//         'overview', 'infrastructure', 'medical', 'shelter', 'needs'
//     ]);

//     // State for disaster input fields
//     const [selectedDisasterIndex, setSelectedDisasterIndex] = useState(0);
//     const [customDisasterName, setCustomDisasterName] = useState('');
//     const [startDate, setStartDate] = useState(subDays(new Date(), 7));
//     const [endDate, setEndDate] = useState(new Date());

//     // State for report generation and management
//     const [isGenerating, setIsGenerating] = useState(false);
//     const [generationProgress, setGenerationProgress] = useState(0);
//     const [reportGenerated, setReportGenerated] = useState(false);
//     const [reportJobId, setReportJobId] = useState(null);
//     const [reportMarkdown, setReportMarkdown] = useState('');
//     const [recentReports, setRecentReports] = useState([]);
//     const [selectedReportId, setSelectedReportId] = useState(null);

//     // State for error handling and notifications
//     const [error, setError] = useState(null);
//     const [snackbarOpen, setSnackbarOpen] = useState(false);
//     const [snackbarMessage, setSnackbarMessage] = useState('');
//     const [snackbarSeverity, setSnackbarSeverity] = useState('info');

//     useEffect(() => {
//         loadRecentReports();
//         // Check the health status of backend services
//         checkBackendServices();
//     }, []);

//     const checkBackendServices = async () => {
//         try {
//             const healthStatus = await reportService.checkHealth();
//             if (healthStatus.status !== 'healthy') {
//                 setSnackbarMessage('Warning: Some backend services may be unavailable');
//                 setSnackbarSeverity('warning');
//                 setSnackbarOpen(true);
//             }
//         } catch (error) {
//             console.error('Failed to check backend health:', error);
//             setSnackbarMessage('Warning: Unable to connect to backend services');
//             setSnackbarSeverity('error');
//             setSnackbarOpen(true);
//         }
//     };

//     useEffect(() => {
//         // Update progress bar during report generation
//         if (isGenerating) {
//             const timer = setInterval(() => {
//                 setGenerationProgress((prev) => {
//                     const newProgress = prev + 5;
//                     if (newProgress >= 95) {
//                         clearInterval(timer);
//                         return 95;
//                     }
//                     return newProgress;
//                 });
//             }, 1000);
//             return () => clearInterval(timer);
//         }
//     }, [isGenerating]);

//     const loadRecentReports = async () => {
//         try {
//             let reports = [];

//             // Try to get from actual API
//             try {
//                 reports = await reportService.getRecentReports();
//             } catch (error) {
//                 console.warn('Error loading reports from API, using sample data:', error);
//                 // Fall back to sample data if API fails
//                 reports = [
//                     { id: 'report-1', title: 'Sample Disaster Impact Report', date: '2025-05-01', type: 'file' },
//                     { id: 'report-2', title: 'Kerala Floods Assessment', date: '2018-08-15', type: 'file' },
//                     { id: 'report-3', title: 'Hurricane Response Plan', date: '2005-08-30', type: 'file' }
//                 ];
//             }

//             setRecentReports(reports);
//         } catch (error) {
//             console.error('Error loading recent reports:', error);
//         }
//     };

//     const handleDisasterChange = (event) => {
//         const index = event.target.value;
//         setSelectedDisasterIndex(index);

//         if (index < DISASTER_OPTIONS.length - 1) {
//             // Selected a predefined disaster
//             const disaster = DISASTER_OPTIONS[index];
//             setRegion(disaster.region);
//         }
//     };

//     const getCurrentDisasterQuery = () => {
//         let eventName;
//         let startDateStr;
//         let endDateStr;

//         if (selectedDisasterIndex === DISASTER_OPTIONS.length - 1) {
//             // Custom disaster
//             eventName = customDisasterName || 'Unknown Disaster';
//             startDateStr = startDate ? format(startDate, 'yyyy-MM-dd') : format(subDays(new Date(), 7), 'yyyy-MM-dd');
//             endDateStr = endDate ? format(endDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
//         } else {
//             // Predefined disaster
//             const disaster = DISASTER_OPTIONS[selectedDisasterIndex];
//             eventName = disaster.name;

//             // For a predefined disaster, use its date as start date and add some days for end date
//             const disasterDate = new Date(disaster.date);
//             startDateStr = disaster.date;

//             // End date depends on timeframe selection
//             if (timeframe === '24h') {
//                 endDateStr = format(new Date(disasterDate.getTime() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
//             } else if (timeframe === '48h') {
//                 endDateStr = format(new Date(disasterDate.getTime() + 2 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
//             } else if (timeframe === 'week') {
//                 endDateStr = format(new Date(disasterDate.getTime() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
//             } else {
//                 endDateStr = format(new Date(), 'yyyy-MM-dd'); // Up to current date
//             }
//         }

//         return {
//             event_name: eventName,
//             start_date: startDateStr,
//             end_date: endDateStr
//         };
//     };

//     const handleGenerateReport = async () => {
//         try {
//             setIsGenerating(true);
//             setGenerationProgress(0);
//             setError(null);

//             // Get the disaster query parameters
//             const query = getCurrentDisasterQuery();

//             // Show what we're generating
//             console.log("Generating report for:", query);
//             setSnackbarMessage(`Generating report for ${query.event_name}...`);
//             setSnackbarSeverity('info');
//             setSnackbarOpen(true);

//             try {
//                 // First, check if backend services are available
//                 const healthStatus = await reportService.checkHealth();
//                 if (healthStatus.status !== 'healthy') {
//                     console.warn('Backend services may not be fully operational:', healthStatus);
//                     setSnackbarMessage('Warning: Backend services may not be fully available. Report generation might be affected.');
//                     setSnackbarSeverity('warning');
//                     setSnackbarOpen(true);
//                 }

//                 // Call the appropriate report generation endpoint based on report type
//                 let response;
//                 if (reportType === 'combined' || reportType === 'situational') {
//                     // For comprehensive reports, use the combined report endpoint
//                     response = await reportService.generateReportFromRAG(query);
//                 } else if (reportType === 'needs' || reportType === 'damage') {
//                     // For social media focused reports, use the social report API
//                     try {
//                         response = await reportService.generateSocialReport(query);
//                     } catch (socialError) {
//                         console.error('Social report generation failed, falling back to RAG:', socialError);
//                         response = await reportService.generateReportFromRAG(query);
//                     }
//                 } else {
//                     // Default to RAG-based report generation
//                     response = await reportService.generateReportFromRAG(query);
//                 }

//                 if (response && response.report) {
//                     // Success - display the report
//                     setReportMarkdown(response.report);
//                     setReportGenerated(true);
//                     setGenerationProgress(100);

//                     // Save the report for future reference (in a real app, would be saved to database)
//                     const newReport = {
//                         id: `report-${Date.now()}`,
//                         title: `${query.event_name} Report`,
//                         date: new Date().toISOString().split('T')[0],
//                         type: 'file',
//                         content: response.report,
//                         sources: response.sources || []
//                     };

//                     setRecentReports([newReport, ...recentReports]);
//                     setSelectedReportId(newReport.id);

//                     setSnackbarMessage('Report successfully generated!');
//                     setSnackbarSeverity('success');
//                     setSnackbarOpen(true);
//                 } else {
//                     throw new Error("Received empty report from backend");
//                 }
//             } catch (error) {
//                 console.error('Report generation failed:', error);
//                 setError(`Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`);
//                 setSnackbarMessage('Failed to generate report. Using sample content for demonstration.');
//                 setSnackbarSeverity('error');
//                 setSnackbarOpen(true);

//                 // For demo purposes, show sample data when real generation fails
//                 setReportMarkdown(`
// # Disaster Assessment Report: ${getCurrentDisasterQuery().event_name}

// ## Executive Summary

// On ${getCurrentDisasterQuery().start_date}, a significant disaster event affected the region of ${region || 'the specified area'}. This report provides an assessment of the current situation based on available data.

// *Note: This is sample content shown because the actual report generation failed to connect with the backend services.*

// ## Possible Issues

// - Backend services may not be running
// - There might be insufficient data available for this disaster
// - The time range specified may be too narrow

// ## Recommended Actions

// 1. Verify that all backend services are operational
// 2. Try with a different disaster event or time range
// 3. Check network connectivity to the backend services

// *For a complete report, please ensure all services are running and try again.*
//         `);
//                 setReportGenerated(true);
//             }
//         } catch (error) {
//             console.error('Error in handleGenerateReport:', error);
//             setError(`An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
//             setSnackbarMessage('An unexpected error occurred');
//             setSnackbarSeverity('error');
//             setSnackbarOpen(true);
//         } finally {
//             setIsGenerating(false);
//         }
//     };

//     const loadReport = (reportId) => {
//         // Find the report in our list of recent reports
//         const report = recentReports.find(r => r.id === reportId);
//         if (report) {
//             if (report.content) {
//                 // If report content is already loaded
//                 setReportMarkdown(report.content);
//             } else {
//                 // In a real app, would fetch the report content from the backend
//                 setReportMarkdown(`
// # ${report.title}

// This is a placeholder for a previously generated report.

// *In a real application, the report content would be loaded from the backend.*
//         `);
//             }

//             setSelectedReportId(reportId);
//             setReportGenerated(true);
//             setActiveStep(3); // Jump to the report view step
//         }
//     };

//     const handleNext = () => {
//         setActiveStep(prevStep => prevStep + 1);
//     };

//     const handleBack = () => {
//         setActiveStep(prevStep => prevStep - 1);
//     };

//     const handleReportTypeChange = (event) => {
//         setReportType(event.target.value);
//     };

//     const handleRegionChange = (event) => {
//         setRegion(event.target.value);
//     };

//     const handleTimeframeChange = (event) => {
//         setTimeframe(event.target.value);
//     };

//     const handleSectionToggle = (section) => {
//         setSelectedSections(prev =>
//             prev.includes(section)
//                 ? prev.filter(s => s !== section)
//                 : [...prev, section]
//         );
//     };

//     const handleSnackbarClose = () => {
//         setSnackbarOpen(false);
//     };

//     const steps = ['Select Disaster', 'Choose Parameters', 'Configure Sections', 'Generate Report'];

//     return (
//         <Box>
//             <Typography variant="h4" component="h1" gutterBottom>
//                 AI-Generated Reports
//             </Typography>
//             <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
//                 Generate comprehensive disaster assessment reports using collected data
//             </Typography>

//             <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
//                 <Box sx={{ flexBasis: { xs: '100%', md: '65%' } }}>
//                     <Paper sx={{ p: 3, mb: 3 }}>
//                         <Typography variant="h6" gutterBottom>Report Generator</Typography>
//                         <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
//                             {steps.map((label) => (
//                                 <Step key={label}>
//                                     <StepLabel>{label}</StepLabel>
//                                 </Step>
//                             ))}
//                         </Stepper>

//                         {activeStep === 0 && (
//                             <Box>
//                                 <Typography variant="subtitle1" gutterBottom>
//                                     Select the disaster event for this report
//                                 </Typography>
//                                 <FormControl fullWidth sx={{ mt: 2, mb: 3 }}>
//                                     <InputLabel>Disaster Event</InputLabel>
//                                     <Select
//                                         value={selectedDisasterIndex}
//                                         label="Disaster Event"
//                                         onChange={handleDisasterChange}
//                                     >
//                                         {DISASTER_OPTIONS.map((option, index) => (
//                                             <MenuItem key={index} value={index}>
//                                                 {option.name} {option.date ? `(${option.date})` : ''}
//                                             </MenuItem>
//                                         ))}
//                                     </Select>
//                                 </FormControl>

//                                 {selectedDisasterIndex === DISASTER_OPTIONS.length - 1 && (
//                                     <Box sx={{ mb: 3 }}>
//                                         <TextField
//                                             fullWidth
//                                             label="Disaster Name"
//                                             value={customDisasterName}
//                                             onChange={(e) => setCustomDisasterName(e.target.value)}
//                                             sx={{ mb: 2 }}
//                                         />

//                                         <LocalizationProvider dateAdapter={AdapterDateFns}>
//                                             <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
//                                                 <DatePicker
//                                                     label="Start Date"
//                                                     value={startDate}
//                                                     onChange={(newValue) => setStartDate(newValue)}
//                                                     sx={{ flexGrow: 1 }}
//                                                 />
//                                                 <DatePicker
//                                                     label="End Date"
//                                                     value={endDate}
//                                                     onChange={(newValue) => setEndDate(newValue)}
//                                                     sx={{ flexGrow: 1 }}
//                                                 />
//                                             </Box>
//                                         </LocalizationProvider>
//                                     </Box>
//                                 )}

//                                 <FormControl fullWidth sx={{ mt: 2, mb: 4 }}>
//                                     <InputLabel>Report Type</InputLabel>
//                                     <Select
//                                         value={reportType}
//                                         label="Report Type"
//                                         onChange={handleReportTypeChange}
//                                     >
//                                         <MenuItem value="situational">Situational Overview</MenuItem>
//                                         <MenuItem value="damage">Damage Assessment</MenuItem>
//                                         <MenuItem value="needs">Needs Analysis</MenuItem>
//                                         <MenuItem value="response">Response Planning</MenuItem>
//                                         <MenuItem value="combined">Comprehensive Report</MenuItem>
//                                     </Select>
//                                 </FormControl>

//                                 <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
//                                     <Button
//                                         variant="contained"
//                                         onClick={handleNext}
//                                     >
//                                         Next
//                                     </Button>
//                                 </Box>
//                             </Box>
//                         )}

//                         {activeStep === 1 && (
//                             <Box>
//                                 <Typography variant="subtitle1" gutterBottom>
//                                     Define report parameters
//                                 </Typography>
//                                 <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, my: 2 }}>
//                                     <FormControl sx={{ minWidth: 250, flexGrow: 1 }}>
//                                         <InputLabel>Geographic Region</InputLabel>
//                                         <Select
//                                             value={region}
//                                             label="Geographic Region"
//                                             onChange={handleRegionChange}
//                                         >
//                                             <MenuItem value="all">All Affected Areas</MenuItem>
//                                             <MenuItem value="downtown">Downtown District</MenuItem>
//                                             <MenuItem value="north">Northern Region</MenuItem>
//                                             <MenuItem value="coastal">Coastal Areas</MenuItem>
//                                         </Select>
//                                     </FormControl>

//                                     <FormControl sx={{ minWidth: 150 }}>
//                                         <InputLabel>Timeframe</InputLabel>
//                                         <Select
//                                             value={timeframe}
//                                             label="Timeframe"
//                                             onChange={handleTimeframeChange}
//                                         >
//                                             <MenuItem value="24h">Last 24 Hours</MenuItem>
//                                             <MenuItem value="48h">Last 48 Hours</MenuItem>
//                                             <MenuItem value="week">Last Week</MenuItem>
//                                             <MenuItem value="all">All Data</MenuItem>
//                                         </Select>
//                                     </FormControl>
//                                 </Box>

//                                 <TextField
//                                     fullWidth
//                                     label="Report Title"
//                                     placeholder="Enter a title for your report"
//                                     variant="outlined"
//                                     sx={{ mt: 2, mb: 4 }}
//                                     defaultValue={`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report - ${selectedDisasterIndex === DISASTER_OPTIONS.length - 1
//                                         ? customDisasterName
//                                         : DISASTER_OPTIONS[selectedDisasterIndex].name
//                                         }`}
//                                 />

//                                 <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
//                                     <Button onClick={handleBack}>
//                                         Back
//                                     </Button>
//                                     <Button
//                                         variant="contained"
//                                         onClick={handleNext}
//                                     >
//                                         Next
//                                     </Button>
//                                 </Box>
//                             </Box>
//                         )}

//                         {activeStep === 2 && (
//                             <Box>
//                                 <Typography variant="subtitle1" gutterBottom>
//                                     Select sections to include in the report
//                                 </Typography>
//                                 <List>
//                                     <ListItem
//                                         secondaryAction={
//                                             <Checkbox
//                                                 edge="end"
//                                                 checked={selectedSections.includes('overview')}
//                                                 onChange={() => handleSectionToggle('overview')}
//                                             />
//                                         }
//                                     >
//                                         <ListItemIcon>
//                                             <Warning />
//                                         </ListItemIcon>
//                                         <ListItemText
//                                             primary="Situation Overview"
//                                             secondary="General assessment of the current disaster situation"
//                                         />
//                                     </ListItem>
//                                     <Divider component="li" />
//                                     <ListItem
//                                         secondaryAction={
//                                             <Checkbox
//                                                 edge="end"
//                                                 checked={selectedSections.includes('infrastructure')}
//                                                 onChange={() => handleSectionToggle('infrastructure')}
//                                             />
//                                         }
//                                     >
//                                         <ListItemIcon>
//                                             <Construction />
//                                         </ListItemIcon>
//                                         <ListItemText
//                                             primary="Infrastructure Status"
//                                             secondary="Roads, bridges, utilities, and communication networks"
//                                         />
//                                     </ListItem>
//                                     <Divider component="li" />
//                                     <ListItem
//                                         secondaryAction={
//                                             <Checkbox
//                                                 edge="end"
//                                                 checked={selectedSections.includes('medical')}
//                                                 onChange={() => handleSectionToggle('medical')}
//                                             />
//                                         }
//                                     >
//                                         <ListItemIcon>
//                                             <LocalHospital />
//                                         </ListItemIcon>
//                                         <ListItemText
//                                             primary="Medical Facilities"
//                                             secondary="Status of hospitals and healthcare services"
//                                         />
//                                     </ListItem>
//                                     <Divider component="li" />
//                                     <ListItem
//                                         secondaryAction={
//                                             <Checkbox
//                                                 edge="end"
//                                                 checked={selectedSections.includes('shelter')}
//                                                 onChange={() => handleSectionToggle('shelter')}
//                                             />
//                                         }
//                                     >
//                                         <ListItemIcon>
//                                             <Home />
//                                         </ListItemIcon>
//                                         <ListItemText
//                                             primary="Shelter Information"
//                                             secondary="Available emergency shelters and capacity"
//                                         />
//                                     </ListItem>
//                                     <Divider component="li" />
//                                     <ListItem
//                                         secondaryAction={
//                                             <Checkbox
//                                                 edge="end"
//                                                 checked={selectedSections.includes('needs')}
//                                                 onChange={() => handleSectionToggle('needs')}
//                                             />
//                                         }
//                                     >
//                                         <ListItemIcon>
//                                             <WaterDrop />
//                                         </ListItemIcon>
//                                         <ListItemText
//                                             primary="Needs Assessment"
//                                             secondary="Critical supplies and resources needed"
//                                         />
//                                     </ListItem>
//                                 </List>

//                                 <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
//                                     <Button onClick={handleBack}>
//                                         Back
//                                     </Button>
//                                     <Button
//                                         variant="contained"
//                                         onClick={() => {
//                                             setActiveStep(3);
//                                             handleGenerateReport();
//                                         }}
//                                     >
//                                         Generate Report
//                                     </Button>
//                                 </Box>
//                             </Box>
//                         )}

//                         {activeStep === 3 && (
//                             <Box>
//                                 <Paper sx={{ p: 3, mb: 3 }}>
//                                     {isGenerating ? (
//                                         <Box sx={{ textAlign: 'center', py: 4 }}>
//                                             <CircularProgress size={60} sx={{ mb: 2 }} />
//                                             <Typography variant="h6" gutterBottom>
//                                                 Generating Disaster Report
//                                             </Typography>
//                                             <Typography variant="body2" color="text.secondary" gutterBottom>
//                                                 AI is analyzing data and compiling a comprehensive report
//                                             </Typography>
//                                             <Box sx={{ width: '100%', mt: 2 }}>
//                                                 <LinearProgress variant="determinate" value={generationProgress} />
//                                                 <Typography variant="caption" align="center" display="block" sx={{ mt: 1 }}>
//                                                     {generationProgress}% Complete
//                                                 </Typography>
//                                             </Box>
//                                         </Box>
//                                     ) : reportGenerated ? (
//                                         <Box sx={{ mb: 3 }}>
//                                             <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
//                                                 <Button startIcon={<Print />} variant="outlined" size="small">
//                                                     Print Report
//                                                 </Button>
//                                                 <Button startIcon={<Download />} variant="outlined" size="small">
//                                                     Download
//                                                 </Button>
//                                                 <Button startIcon={<Share />} variant="outlined" size="small">
//                                                     Share
//                                                 </Button>
//                                             </Box>

//                                             <Box sx={{
//                                                 p: 3,
//                                                 border: '1px solid rgba(0, 0, 0, 0.12)',
//                                                 borderRadius: 1,
//                                                 bgcolor: 'background.paper'
//                                             }}>
//                                                 <ReactMarkdown>{reportMarkdown}</ReactMarkdown>
//                                             </Box>

//                                             {/* Example accordion sections that would appear in the full report */}
//                                             <Box sx={{ mt: 3 }}>
//                                                 <Accordion>
//                                                     <AccordionSummary expandIcon={<ExpandMore />}>
//                                                         <Typography variant="subtitle1">Infrastructure Status</Typography>
//                                                     </AccordionSummary>
//                                                     <AccordionDetails>
//                                                         <Typography variant="body2" component="div">
//                                                             <strong>Major damage reported:</strong>
//                                                             <ul>
//                                                                 <li>Main Bridge: Complete structural collapse, impassable</li>
//                                                                 <li>Municipal Power Station: Operating at 40% capacity</li>
//                                                                 <li>Water Treatment Plant: Filtration systems compromised</li>
//                                                                 <li>Downtown roads: 60% blocked by debris</li>
//                                                             </ul>
//                                                         </Typography>
//                                                     </AccordionDetails>
//                                                 </Accordion>

//                                                 <Accordion>
//                                                     <AccordionSummary expandIcon={<ExpandMore />}>
//                                                         <Typography variant="subtitle1">Medical Facilities</Typography>
//                                                     </AccordionSummary>
//                                                     <AccordionDetails>
//                                                         <Typography variant="body2" component="div">
//                                                             <strong>Hospital status:</strong>
//                                                             <ul>
//                                                                 <li>Central Hospital: Damaged east wing, ER operational</li>
//                                                                 <li>South Medical Center: Fully operational, at 120% capacity</li>
//                                                                 <li>North Clinic: Minor damage, limited services available</li>
//                                                             </ul>
//                                                         </Typography>
//                                                     </AccordionDetails>
//                                                 </Accordion>

//                                                 <Accordion>
//                                                     <AccordionSummary expandIcon={<ExpandMore />}>
//                                                         <Typography variant="subtitle1">Critical Needs</Typography>
//                                                     </AccordionSummary>
//                                                     <AccordionDetails>
//                                                         <Typography variant="body2" component="div">
//                                                             <strong>Immediate priorities (0-48 hours):</strong>
//                                                             <ul>
//                                                                 <li>Search and rescue teams for downtown collapsed structures</li>
//                                                                 <li>Medical supplies, particularly trauma kits and IV fluids</li>
//                                                                 <li>Emergency shelter capacity for approximately 500 displaced people</li>
//                                                                 <li>Water purification supplies for northern district</li>
//                                                                 <li>Temporary bridges or solutions for east-west transit</li>
//                                                             </ul>
//                                                         </Typography>
//                                                     </AccordionDetails>
//                                                 </Accordion>
//                                             </Box>

//                                             <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
//                                                 <Button
//                                                     variant="outlined"
//                                                     onClick={() => {
//                                                         setActiveStep(0);
//                                                         setReportGenerated(false);
//                                                     }}
//                                                 >
//                                                     Create New Report
//                                                 </Button>
//                                                 <Button variant="contained">
//                                                     Share Report
//                                                 </Button>
//                                             </Box>
//                                         </Box>
//                                     ) : (
//                                         <Box sx={{ textAlign: 'center', py: 4 }}>
//                                             <Typography variant="h6" gutterBottom>
//                                                 Ready to Generate Report
//                                             </Typography>
//                                             <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
//                                                 Click the button below to start generating your report
//                                             </Typography>
//                                             <Button
//                                                 variant="contained"
//                                                 onClick={handleGenerateReport}
//                                                 size="large"
//                                             >
//                                                 Start Generation
//                                             </Button>
//                                         </Box>
//                                     )}
//                                 </Paper>

//                                 {!reportGenerated && (
//                                     <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
//                                         <Button onClick={handleBack}>
//                                             Back
//                                         </Button>
//                                     </Box>
//                                 )}
//                             </Box>
//                         )}
//                     </Paper>
//                 </Box>

//                 <Box sx={{ flexBasis: { xs: '100%', md: '30%' } }}>
//                     <Paper sx={{ p: 3 }}>
//                         <Typography variant="h6" gutterBottom>Recent Reports</Typography>
//                         <List dense>
//                             {recentReports.map(report => (
//                                 <ListItem
//                                     key={report.id}
//                                     secondaryAction={
//                                         <IconButton edge="end" size="small" onClick={() => loadReport(report.id)}>
//                                             <CloudDownload fontSize="small" />
//                                         </IconButton>
//                                     }
//                                     sx={{
//                                         borderLeft: '4px solid',
//                                         borderColor: 'primary.main',
//                                         pl: 2,
//                                         mb: 1,
//                                         borderRadius: '4px',
//                                         backgroundColor: selectedReportId === report.id ? 'action.selected' : 'inherit'
//                                     }}
//                                 >
//                                     <ListItemIcon sx={{ minWidth: 36 }}>
//                                         <Description fontSize="small" />
//                                     </ListItemIcon>
//                                     <ListItemText
//                                         primary={report.title}
//                                         secondary={`${report.date}`}
//                                     />
//                                 </ListItem>
//                             ))}
//                         </List>
//                         <Divider sx={{ my: 2 }} />
//                         <Typography variant="subtitle2" gutterBottom>
//                             Report Templates
//                         </Typography>
//                         <List dense>
//                             <ListItem>
//                                 <ListItemIcon sx={{ minWidth: 36 }}>
//                                     <Check fontSize="small" />
//                                 </ListItemIcon>
//                                 <ListItemText primary="Situation Report (SITREP)" />
//                             </ListItem>
//                             <ListItem>
//                                 <ListItemIcon sx={{ minWidth: 36 }}>
//                                     <Check fontSize="small" />
//                                 </ListItemIcon>
//                                 <ListItemText primary="Damage Assessment" />
//                             </ListItem>
//                             <ListItem>
//                                 <ListItemIcon sx={{ minWidth: 36 }}>
//                                     <Check fontSize="small" />
//                                 </ListItemIcon>
//                                 <ListItemText primary="Needs Analysis" />
//                             </ListItem>
//                             <ListItem>
//                                 <ListItemIcon sx={{ minWidth: 36 }}>
//                                     <Check fontSize="small" />
//                                 </ListItemIcon>
//                                 <ListItemText primary="Response Plan" />
//                             </ListItem>
//                         </List>
//                     </Paper>
//                 </Box>
//             </Box>
//         </Box>
//     );
// }