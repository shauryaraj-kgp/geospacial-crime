import React, { useRef, useState, useEffect, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import { Map as MapGL, NavigationControl, ScaleControl, Popup, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import '../styles/DisasterMap.css';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Autocomplete } from '@mui/material';
import { Tabs, Tab } from '@mui/material';
import { Backdrop, CircularProgress } from '@mui/material';
import {
    Box,
    TextField,
    Paper,
    Typography,
    IconButton,
    Stack,
    Button,
    ToggleButton,
    ToggleButtonGroup,
    List,
    ListItem,
    ListItemText,
    Card,
    CardContent,
    Divider
} from '@mui/material';
import {
    Search as SearchIcon,
    Refresh as RefreshIcon,
    MyLocation as MyLocationIcon,
    Info as InfoIcon,
    Download as DownloadIcon,
    Share as ShareIcon,
    Warning as WarningIcon,
    Mood as MoodIcon,
    SentimentVeryDissatisfied as AngryIcon
} from '@mui/icons-material';
import {
    fetchAllRegions,
    fetchCrimeTotals,
    fetchSentimentTotals,
    fetchCrimeTotal,
    fetchSentimentTotal,
    fetchCrimeReasons,
    fetchWardMappings,
    fetchWardLatLon
} from '../api';

const metaFields = [
    'source_location', 'COUNCIL NAME', 'WARD CODE', 'Population_Census_2022-03-20', 'Area', 'longitude', 'latitude', 'year', 'month', 'DETECTED CRIME', 'neg_ratio'
];

// Utility functions for data calculations
const DataUtils = {
    getFilteredData: (data, wardCode, year, month) => {
        return data.filter(row =>
            row['WARD CODE'] === wardCode &&
            row.year === year &&
            row.month === month
        );
    },

    getTotalMetric: (data, wardCode, year, month, metric) => {
        const relevantRows = DataUtils.getFilteredData(data, wardCode, year, month);
        return relevantRows.reduce((total, row) =>
            total + (typeof row[metric] === 'number' ? row[metric] : 0), 0);
    },

    getRegionRanks: (data, wardCode, year, month) => {
        // Get all unique ward codes
        const uniqueWards = [...new Set(data.map(entry => entry['WARD CODE']))];

        // Calculate totals for each ward
        const wardTotals = uniqueWards.map(ward => ({
            ward: ward,
            totalCrime: DataUtils.getTotalMetric(data, ward, year, month, 'DETECTED CRIME'),
            totalSentiment: DataUtils.getTotalMetric(data, ward, year, month, 'neg_ratio')
        }));

        // Sort by totals
        const crimeRanked = [...wardTotals].sort((a, b) => b.totalCrime - a.totalCrime);
        const sentimentRanked = [...wardTotals].sort((a, b) => b.totalSentiment - a.totalSentiment);

        return {
            crimeRank: crimeRanked.findIndex(d => d.ward === wardCode) + 1,
            sentimentRank: sentimentRanked.findIndex(d => d.ward === wardCode) + 1,
            totalRegions: uniqueWards.length,
            totalCrime: crimeRanked.find(d => d.ward === wardCode)?.totalCrime || 0,
            totalSentiment: sentimentRanked.find(d => d.ward === wardCode)?.totalSentiment || 0
        };
    },

    getStatus: (rank) => {
        if (rank <= 5) {
            return { color: 'success', text: 'Low' };
        } else if (rank <= 10) {
            return { color: 'warning', text: 'Medium' };
        } else {
            return { color: 'error', text: 'High' };
        }
    },

    getCrimeReasons: (data, wardCode, year, month) => {
        const relevantData = DataUtils.getFilteredData(data, wardCode, year, month);
        const reasons = relevantData.map(row => row['DETECTED CRIME'] > 0 ? row['DETECTED CRIME'] : 0).join(', ');
        return reasons;
    }
};

const DisasterMap = () => {
    const [viewState, setViewState] = useState({
        longitude: -4.2026,
        latitude: 57.4907,
        zoom: 5,
        bearing: 0,
        pitch: 0,
        padding: { top: 0, bottom: 0, left: 0, right: 0 }
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedWardCode, setSelectedWardCode] = useState(null);
    const [scoreType, setScoreType] = useState('crimeScore');
    const [selectedYear, setSelectedYear] = useState(2024);
    const [selectedMonth, setSelectedMonth] = useState(12);
    const [geoData, setGeoData] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date(2024, 11));
    const [popupInfo, setPopupInfo] = useState(null);
    const mapRef = useRef(null);
    const [tabIndex, setTabIndex] = useState(0);
    const [geoLoading, setGeoLoading] = useState(true);
    const [allWardCodes, setAllWardCodes] = useState([]);
    const [crimeTotals, setCrimeTotals] = useState({});
    const [sentimentTotals, setSentimentTotals] = useState({});
    const [wardOptions, setWardOptions] = useState([]);
    const [wardCrimeReasons, setWardCrimeReasons] = useState([]);
    const [wardCrimeTotal, setWardCrimeTotal] = useState(null);
    const [wardSentimentTotal, setWardSentimentTotal] = useState(null);
    const [wardMappings, setWardMappings] = useState([]);
    const [allSourceLocations, setAllSourceLocations] = useState([]);
    const [selectedSourceLocation, setSelectedSourceLocation] = useState(null);
    const [backendReady, setBackendReady] = useState(false);
    const [selectedLatLon, setSelectedLatLon] = useState(null);

    // Fetch all regions and totals on mount or when year/month changes
    useEffect(() => {
        setGeoLoading(true);
        Promise.all([
            fetchAllRegions(),
            fetchCrimeTotals(selectedYear, selectedMonth),
            fetchSentimentTotals(selectedYear, selectedMonth)
        ]).then(([regions, crimeTotals, sentimentTotals]) => {
            setAllWardCodes(regions);
            setCrimeTotals(crimeTotals);
            setSentimentTotals(sentimentTotals);
            setWardOptions(regions.map(region => ({
                label: region,
                value: region
            })));
        }).finally(() => setGeoLoading(false));
    }, [selectedYear, selectedMonth]);

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

    // Fetch area crime/sentiment/crime reasons when selectedWardCode changes
    useEffect(() => {
        if (!selectedWardCode) return;
        setGeoLoading(true);
        Promise.all([
            fetchCrimeTotal(selectedYear, selectedMonth, selectedWardCode),
            fetchSentimentTotal(selectedYear, selectedMonth, selectedWardCode),
            fetchCrimeReasons(selectedYear, selectedMonth, selectedWardCode)
        ]).then(([crimeTotal, sentimentTotal, crimeReasons]) => {
            setWardCrimeTotal(crimeTotal.total_detected_crime);
            setWardSentimentTotal(sentimentTotal.average_sentiment);
            setWardCrimeReasons(Object.entries(crimeReasons));
        }).finally(() => setGeoLoading(false));
    }, [selectedWardCode, selectedYear, selectedMonth]);

    useEffect(() => {
        fetchWardMappings()
            .then((mappings) => {
                setWardMappings(mappings);
                setAllSourceLocations(mappings.map(m => m.source_location));
                setBackendReady(true);
            })
            .catch(() => setAllSourceLocations([]));
    }, []);

    const getColor = (score) => {
        if (score == null || isNaN(score)) return '#e0e0e0';

        // Helper function to get RGB values for gradient
        const getRGBValues = (t) => {
            // Ensure t is between 0 and 1
            t = Math.max(0, Math.min(1, t));

            if (t <= 0) return [0, 255, 0];      // pure green
            if (t >= 1) return [255, 0, 0];      // pure red

            if (t < 0.5) {
                // Green to Yellow (0 to 0.5)
                const normalized = t * 2;
                return [255 * normalized, 255, 0];
            } else {
                // Yellow to Red (0.5 to 1)
                const normalized = (t - 0.5) * 2;
                return [255, 255 * (1 - normalized), 0];
            }
        };

        let t;
        if (scoreType === 'crimeScore') {
            // Crime: 0 (green) to 20+ (red)
            t = Math.min(score / 20, 1);
        } else {
            // Sentiment: >-0.5 (green) to <-1.5 (red)
            if (score > -0.5) return `rgb(0,255,0)`;  // pure green
            if (score < -1.5) return `rgb(255,0,0)`;  // pure red
            // Convert -0.5 to -1.5 range to 0 to 1 scale for gradient
            t = (Math.abs(score) - 0.5) / 1;  // 1 is the range (-1.5 - (-0.5))
        }

        const [r, g, b] = getRGBValues(t);
        return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
    };

    const regionalScoreMap = useMemo(() => {
        const map = {};
        if (scoreType === 'crimeScore') {
            Object.entries(crimeTotals).forEach(([ward_code, score]) => {
                const mapping = wardMappings.find(m => m.ward_code === ward_code);
                if (mapping) map[mapping.source_location] = score;
            });
        } else {
            Object.entries(sentimentTotals).forEach(([ward_code, score]) => {
                const mapping = wardMappings.find(m => m.ward_code === ward_code);
                if (mapping) map[mapping.source_location] = score;
            });
        }
        return map;
    }, [scoreType, crimeTotals, sentimentTotals, wardMappings]);

    const layerStyle = useMemo(() => ({
        id: 'scotland-regions-layer',
        type: 'fill',
        paint: {
            'fill-color': [
                'match',
                ['get', 'WD13NM'],
                ...Object.entries(regionalScoreMap).map(([id, score]) => [id, getColor(score)]).flat(),
                '#e0e0e0'
            ],
            'fill-opacity': 0.5,
            'fill-outline-color': '#666666'
        }
    }), [regionalScoreMap]);

    const onClick = (event) => {
        if (event.features && event.features.length > 0) {
            const feature = event.features[0];
            const properties = feature.properties || {};
            const regionName = properties.WD13NM;
            if (event.lngLat) {
                setPopupInfo({
                    longitude: event.lngLat.lng,
                    latitude: event.lngLat.lat,
                    label: regionName,
                    value: regionalScoreMap[regionName]
                });
            }
        } else {
            setPopupInfo(null);
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

    const handleSelectLocation = async (sourceLocation) => {
        setSelectedSourceLocation(sourceLocation);
        const mapping = wardMappings.find(m => m.source_location === sourceLocation);
        if (mapping) {
            setSelectedWardCode(mapping.ward_code);
            try {
                const { latitude, longitude } = await fetchWardLatLon(mapping.ward_code);
                setSelectedLatLon({ latitude, longitude });
                flyToLocation(longitude, latitude, 10);
                setPopupInfo({
                    longitude,
                    latitude,
                    label: sourceLocation,
                    value: regionalScoreMap[sourceLocation]
                });
            } catch (e) {
                setSelectedLatLon(null);
            }
            setTabIndex(1);
        } else {
            setSelectedWardCode(null);
            setSelectedLatLon(null);
        }
    };

    const handleScoreTypeChange = (event, newScoreType) => {
        if (newScoreType !== null) {
            setScoreType(newScoreType);
            if (newScoreType === 'crimeScore') {
                setTabIndex(0);
            }
        }
    };

    const topAreas = useMemo(() => {
        const areaScores = Object.entries(regionalScoreMap).map(([region, score]) => ({
            name: region,
            score: score
        }));
        return areaScores
            .sort((a, b) => scoreType === 'sentimentScore' ? a.score - b.score : b.score - a.score)
            .slice(0, 5);
    }, [regionalScoreMap, scoreType]);

    const handleDateChange = (newDate) => {
        if (newDate) {
            const year = newDate.getFullYear();
            const month = newDate.getMonth() + 1;
            setSelectedYear(year);
            setSelectedMonth(month);
            setSelectedDate(newDate);
        }
    };

    const isDateInRange = (date) => {
        const start = new Date(2019, 3);
        const end = new Date(2024, 11);
        return date >= start && date <= end;
    };

    const getSourceLocation = (ward_code) => {
        const mapping = wardMappings.find(m => m.ward_code === ward_code);
        return mapping ? mapping.source_location : ward_code;
    };

    return (
        <div className='disaster-map-container'>
            <Box sx={{ height: 'calc(100vh - 32px)', display: 'flex', flexDirection: 'column', padding: '20px' }}>
                <header className="map-header">
                    <h1>
                        Scotland Crime & Sentiment Heatmap
                    </h1>
                    <p>
                        Explore crime rates and public sentiment across Scotland's wards. The color scale runs from green (low crime/least negative sentiment) through yellow and orange to red (high crime/most negative sentiment). Zoom in for more detail and click on a region for statistics and trends.
                    </p>
                </header>

                <Box sx={{ display: 'flex', flex: 1, gap: 2, px: 2, minHeight: 0 }}>
                    <Box sx={{ flex: 0.7, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                        <Box
                            component="form"
                            sx={{ display: 'flex', gap: 2, width: '100%', alignItems: 'center', mb: 2 }}
                            onSubmit={(e) => e.preventDefault()}
                        >
                            <Autocomplete
                                fullWidth
                                options={allSourceLocations}
                                value={selectedSourceLocation}
                                onChange={(_, newValue) => handleSelectLocation(newValue)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Search areas..."
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
                                <IconButton size="small" onClick={() => { setSelectedWardCode(null); flyToLocation(-4.2026, 57.4907, 5); }}><RefreshIcon /></IconButton>
                                <IconButton size="small"><MyLocationIcon /></IconButton>
                                <IconButton size="small"><InfoIcon /></IconButton>
                                <IconButton size="small"><DownloadIcon /></IconButton>
                                <IconButton size="small"><ShareIcon /></IconButton>
                            </Stack>
                        </Box>
                        <Box sx={{
                            position: 'relative',
                            flex: 1,
                            minHeight: 0
                        }}>
                            {geoLoading && (
                                <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', bgcolor: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <CircularProgress color="primary" />
                                    <Typography variant="subtitle1" sx={{ mt: 2, color: 'text.secondary' }}>Loading...</Typography>
                                </Box>
                            )}
                            <MapGL
                                ref={mapRef}
                                mapLib={maplibregl}
                                {...viewState}
                                onMove={evt => setViewState(evt.viewState)}
                                style={{ width: '100%', height: '100%', position: 'absolute' }}
                                mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
                                interactiveLayerIds={['scotland-regions-layer']}
                                onClick={onClick}
                                cursor={selectedWardCode ? 'pointer' : 'default'}
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
                                            {scoreType === 'crimeScore' ? 'Crime Rate' : 'Negative Ratio'} ({selectedMonth}/{selectedYear}): {popupInfo.value?.toFixed(2) ?? 'N/A'}
                                        </div>
                                    </Popup>
                                )}
                                <Box sx={{ position: 'absolute', top: 10, left: 10, zIndex: 1, backgroundColor: 'white', borderRadius: 1, boxShadow: 1, p: 0.5 }}>
                                    <ToggleButtonGroup value={scoreType} exclusive onChange={handleScoreTypeChange} size="small">
                                        <ToggleButton value="crimeScore">Crime Score</ToggleButton>
                                        <ToggleButton value="sentimentScore">Sentiment Score</ToggleButton>
                                    </ToggleButtonGroup>
                                </Box>
                            </MapGL>
                        </Box>
                    </Box>
                    <Box sx={{ flex: 0.3, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                        <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                            <CardContent sx={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                minHeight: 0,
                                overflow: 'hidden'
                            }}>
                                <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} variant="fullWidth" sx={{ mb: 2 }}>
                                    <Tab label="Top Areas" />
                                    <Tab label="Area Details" />
                                </Tabs>
                                <Box sx={{
                                    flex: 1,
                                    overflowY: 'auto',
                                    minHeight: 0
                                }}>
                                    {tabIndex === 0 && (
                                        <>
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="subtitle2" gutterBottom>
                                                    Select Month and Year
                                                </Typography>
                                                <LocalizationProvider dateAdapter={AdapterDateFns}>
                                                    <DatePicker
                                                        views={['year', 'month']}
                                                        value={selectedDate}
                                                        onChange={handleDateChange}
                                                        shouldDisableDate={(date) => !isDateInRange(date)}
                                                        minDate={new Date(2019, 3)}
                                                        maxDate={new Date(2024, 11)}
                                                        slotProps={{
                                                            textField: {
                                                                fullWidth: true,
                                                                size: "small"
                                                            }
                                                        }}
                                                    />
                                                </LocalizationProvider>
                                            </Box>
                                            <Divider sx={{ my: 2 }} />
                                            <Typography variant="subtitle2" gutterBottom>
                                                Top 5 Areas - {scoreType === 'crimeScore' ? 'Highest Crime Rate' : 'Most Negative Sentiment'}
                                            </Typography>
                                            <List dense>
                                                {topAreas.map((area, index) => (
                                                    <ListItem
                                                        key={area.name}
                                                        button={true}
                                                        onClick={() => {
                                                            handleSelectLocation(area.name);
                                                            setTabIndex(1);
                                                        }}
                                                        sx={{ backgroundColor: index === 0 ? 'rgba(255, 0, 0, 0.1)' : 'transparent', borderRadius: 1, mb: 0.5, cursor: 'pointer' }}
                                                    >
                                                        <ListItemText
                                                            primary={`${index + 1}. ${getSourceLocation(area.name)}`}
                                                            secondary={`${scoreType === 'crimeScore' ? 'Crime Rate' : 'Negative Ratio'}: ${area.score.toFixed(2)}`}
                                                        />
                                                        {index === 0 && (
                                                            <Box component="span" sx={{ ml: 1 }}>
                                                                {scoreType === 'crimeScore' ? <WarningIcon color="error" /> : scoreType === 'sentimentScore' ? <AngryIcon sx={{ color: 'red' }} /> : <MoodIcon sx={{ color: 'orange' }} />}
                                                            </Box>
                                                        )}
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </>
                                    )}
                                    {tabIndex === 1 && selectedWardCode && (
                                        <>
                                            <Typography variant="h6" gutterBottom>
                                                {getSourceLocation(selectedWardCode)} - {selectedMonth}/{selectedYear}
                                            </Typography>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Top Crimes
                                            </Typography>
                                            <List dense>
                                                {wardCrimeReasons.length > 0 ? wardCrimeReasons.slice(0, 5).map(([crime, value], idx) => (
                                                    <ListItem key={crime}>
                                                        <ListItemText
                                                            primary={`${idx + 1}. ${crime}`}
                                                            secondary={`Incidents: ${value}`}
                                                        />
                                                    </ListItem>
                                                )) : (
                                                    <ListItem>
                                                        <ListItemText primary="No crimes reported" />
                                                    </ListItem>
                                                )}
                                            </List>
                                            <Divider sx={{ my: 2 }} />
                                            <Typography variant="subtitle2" gutterBottom>
                                                Total Detected Crime
                                            </Typography>
                                            <Typography variant="h5" color="error" gutterBottom>
                                                {wardCrimeTotal !== null ? wardCrimeTotal : 'N/A'}
                                            </Typography>
                                        </>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                </Box>
            </Box>
        </div>
    );
};

export default DisasterMap; 