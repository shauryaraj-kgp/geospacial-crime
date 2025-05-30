import React, { useRef, useState, useEffect, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import { Map as MapGL, NavigationControl, ScaleControl, Popup, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import '../styles/DisasterMap.css';
import regionalData from '../data/new_monthly_data.json';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Autocomplete } from '@mui/material';
import { Tabs, Tab } from '@mui/material';

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
    Mood as MoodIcon
} from '@mui/icons-material';

const metaFields = [
    'source_location', 'COUNCIL NAME', 'WARD CODE', 'Population_Census_2022-03-20', 'Area', 'longitude', 'latitude', 'year', 'month', 'DETECTED CRIME', 'neg_ratio'
];

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
    const [selectedArea, setSelectedArea] = useState(null);
    const [scoreType, setScoreType] = useState('crimeScore');
    const [selectedYear, setSelectedYear] = useState(2024);
    const [selectedMonth, setSelectedMonth] = useState(12);
    const [geoData, setGeoData] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date(2024, 11));
    const [popupInfo, setPopupInfo] = useState(null);
    const mapRef = useRef(null);
    const [tabIndex, setTabIndex] = useState(0);

    // Get all unique council areas from regional data
    const areaOptions = useMemo(() => {
        const uniqueAreas = new Map();

        regionalData.forEach(entry => {
            if (!uniqueAreas.has(entry['source_location'])) {
                uniqueAreas.set(entry['source_location'], {
                    label: entry['source_location'],
                    wardCode: entry['WARD CODE'],
                    longitude: entry.longitude,
                    latitude: entry.latitude
                });
            }
        });

        return Array.from(uniqueAreas.values())
            .sort((a, b) => a.label.localeCompare(b.label));
    }, []);

    // Fetch GeoJSON file once
    useEffect(() => {
        fetch('/data/scotland-geodata.json')
            .then((res) => res.json())
            .then((data) => {
                setGeoData(data);
            })
            .catch((err) => console.error('Failed to load geoData:', err));
    }, []);

    // Precompute the scores for the selected year/month
    const regionalScoreMap = useMemo(() => {
        const map = {};
        for (const entry of regionalData) {
            if (
                entry.year === selectedYear &&
                entry.month === selectedMonth &&
                entry['WARD CODE']
            ) {
                const key = entry['WARD CODE'];
                const value =
                    scoreType === 'crimeScore'
                        ? parseFloat(entry['DETECTED CRIME'])
                        : parseFloat(entry['neg_ratio']);

                if (!isNaN(value)) map[key] = value;
            }
        }
        return map;
    }, [scoreType, selectedYear, selectedMonth]);

    const getColor = (score) => {
        if (score == null || score < 0) return '#e0e0e0'; // Softer gray

        if (scoreType === 'crimeScore') {
            const thresholds = [0, 1, 2, 4, 6, 7, 10, 13, 17, 23, 248];
            let index = thresholds.findIndex((t) => score <= t);
            if (index === -1) index = thresholds.length - 1;
            const percent = index / (thresholds.length - 1);

            // Balanced color palette
            if (percent < 0.2) return '#33cc33'; // Medium green
            if (percent < 0.4) return '#99cc33'; // Medium lime
            if (percent < 0.6) return '#ffcc00'; // Medium yellow
            if (percent < 0.8) return '#ff9933'; // Medium orange
            return '#ff3333'; // Medium red
        }

        if (scoreType === 'sentimentScore') {
            const clamped = Math.max(0, Math.min(1, score));

            // Balanced color palette for sentiment
            if (clamped < 0.2) return '#33cc33'; // Medium green
            if (clamped < 0.4) return '#99cc33'; // Medium lime
            if (clamped < 0.6) return '#ffcc00'; // Medium yellow
            if (clamped < 0.8) return '#ff9933'; // Medium orange
            return '#ff3333'; // Medium red
        }

        return '#e0e0e0'; // Softer gray
    };

    // Create layer style
    const layerStyle = useMemo(() => ({
        id: 'scotland-regions-layer',
        type: 'fill',
        paint: {
            'fill-color': [
                'match',
                ['get', 'WD13CD'],
                ...Object.entries(regionalScoreMap).map(([id, score]) => [
                    id,
                    getColor(score)
                ]).flat(),
                '#e0e0e0'
            ],
            'fill-opacity': 0.5,
            'fill-outline-color': '#666666'
        }
    }), [regionalScoreMap]);

    // Handle click on map
    const onClick = (event) => {
        if (event.features && event.features.length > 0) {
            const feature = event.features[0];
            const properties = feature.properties || {};
            const wardCode = properties.WD13CD;
            const regionName = properties.WD13NM;
            const score = regionalScoreMap[wardCode];

            if (event.lngLat) {
                setPopupInfo({
                    longitude: event.lngLat.lng,
                    latitude: event.lngLat.lat,
                    label: regionName,
                    value: score
                });
            }
        } else {
            // Close popup when clicking anywhere else on the map
            setPopupInfo(null);
        }
    };

    // Function to smoothly fly to a location
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
            setViewState(vs => ({
                ...vs,
                longitude,
                latitude,
                zoom
            }));
        }
    };

    // Handle area selection from search
    const handleAreaSelect = (event, newValue) => {
        setSelectedArea(newValue);
        if (newValue) {
            setTabIndex(1); // Switch to Area Details tab
            flyToLocation(newValue.longitude, newValue.latitude, 9);

            const score = regionalData.find(
                entry =>
                    entry['WARD CODE'] === newValue.wardCode &&
                    entry.year === selectedYear &&
                    entry.month === selectedMonth
            );

            if (score) {
                const value = scoreType === 'crimeScore'
                    ? parseFloat(score['DETECTED CRIME'])
                    : parseFloat(score['neg_ratio']);

                setPopupInfo({
                    longitude: newValue.longitude,
                    latitude: newValue.latitude,
                    label: newValue.label,
                    value: value
                });
            }
        } else {
            setTabIndex(0); // Switch back to Top 5 Areas tab
            setPopupInfo(null);
        }
    };

    const handleScoreTypeChange = (event, newScoreType) => {
        if (newScoreType !== null) {
            setScoreType(newScoreType);
        }
    };

    // Get top 5 areas based on current score type
    const topAreas = useMemo(() => {
        const areaScores = [];
        for (const entry of regionalData) {
            if (entry.year === selectedYear && entry.month === selectedMonth) {
                const score = scoreType === 'crimeScore'
                    ? parseFloat(entry['DETECTED CRIME'])
                    : parseFloat(entry['neg_ratio']);
                if (!isNaN(score)) {
                    // Find the corresponding GeoJSON feature to get the area name
                    const feature = geoData?.features?.find(f => f.properties.WD13CD === entry['WARD CODE']);
                    areaScores.push({
                        name: entry['source_location'] || 'Unknown Area',
                        score: score,
                        wardCode: entry['WARD CODE']
                    });
                }
            }
        }
        return areaScores
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
    }, [selectedYear, selectedMonth, scoreType, regionalData, geoData]);

    // Handle date change
    const handleDateChange = (newDate) => {
        if (newDate) {
            const year = newDate.getFullYear();
            const month = newDate.getMonth() + 1;
            setSelectedYear(year);
            setSelectedMonth(month);
            setSelectedDate(newDate);
        }
    };

    // Check if date is in valid range
    const isDateInRange = (date) => {
        const start = new Date(2019, 3); // April 2019
        const end = new Date(2024, 11);  // December 2024
        return date >= start && date <= end;
    };

    // Switch to Top 5 Areas tab when selectedArea becomes null
    useEffect(() => {
        if (selectedArea === null) {
            setTabIndex(0);
        }
    }, [selectedArea]);

    // Get area crime details for selected area/month/year
    let areaCrimeDetails = null;
    if (selectedArea) {
        areaCrimeDetails = regionalData.find(entry =>
            entry['WARD CODE'] === selectedArea.wardCode &&
            entry.year === selectedYear &&
            entry.month === selectedMonth
        );
    }
    let topCrimes = [];
    let totalDetectedCrime = null;
    if (areaCrimeDetails) {
        // Get all crime fields (exclude meta fields)
        const crimes = Object.entries(areaCrimeDetails)
            .filter(([key, value]) => !metaFields.includes(key) && typeof value === 'number' && value > 0)
            .map(([key, value]) => ({ crime: key, value }));
        // Sort by value descending
        crimes.sort((a, b) => b.value - a.value);
        topCrimes = crimes.slice(0, 5);
        totalDetectedCrime = areaCrimeDetails['DETECTED CRIME'];
    }

    return (
        <>
            <Box sx={{ height: 'calc(100vh - 32px)', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <Box sx={{ p: 2 }}>
                    <Typography variant="h4" marginBottom={1}>Interactive Disaster Map</Typography>
                    <Typography variant="body1" marginBottom={1}>description.....</Typography>
                </Box>

                {/* Main content */}
                <Box sx={{ display: 'flex', flex: 1, gap: 2, px: 2 }}>
                    {/* Left side - Map */}
                    <Box sx={{ flex: 0.7 }}>
                        <Box
                            component="form"
                            sx={{
                                display: 'flex',
                                gap: 2,
                                width: '100%',
                                alignItems: 'center',
                                mb: 2
                            }}
                            onSubmit={(e) => e.preventDefault()}
                        >
                            <Autocomplete
                                fullWidth
                                options={areaOptions}
                                value={selectedArea}
                                onChange={handleAreaSelect}
                                isOptionEqualToValue={(option, value) => option.wardCode === value?.wardCode}
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
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        setSelectedArea(null);
                                        flyToLocation(-4.2026, 57.4907, 5);
                                    }}
                                >
                                    <RefreshIcon />
                                </IconButton>
                                <IconButton size="small"><MyLocationIcon /></IconButton>
                                <IconButton size="small"><InfoIcon /></IconButton>
                                <IconButton size="small"><DownloadIcon /></IconButton>
                                <IconButton size="small"><ShareIcon /></IconButton>
                            </Stack>
                        </Box>

                        <Box sx={{ position: 'relative', width: '100%', height: 'calc(100% - 52px)' }}>
                            <MapGL
                                ref={mapRef}
                                mapLib={maplibregl}
                                {...viewState}
                                onMove={evt => setViewState(evt.viewState)}
                                style={{ width: '100%', height: '100%' }}
                                mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
                                interactiveLayerIds={['scotland-regions-layer']}
                                onClick={onClick}
                                cursor={selectedArea ? 'pointer' : 'default'}
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

                                {/* Toggle Button */}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 10,
                                        left: 10,
                                        zIndex: 1,
                                        backgroundColor: 'white',
                                        borderRadius: 1,
                                        boxShadow: 1,
                                        p: 0.5
                                    }}
                                >
                                    <ToggleButtonGroup
                                        value={scoreType}
                                        exclusive
                                        onChange={handleScoreTypeChange}
                                        size="small"
                                    >
                                        <ToggleButton value="crimeScore">
                                            Crime Score
                                        </ToggleButton>
                                        <ToggleButton value="sentimentScore">
                                            Sentiment Score
                                        </ToggleButton>
                                    </ToggleButtonGroup>
                                </Box>
                            </MapGL>
                        </Box>
                    </Box>

                    {/* Right side - Controls and Stats */}
                    <Box sx={{ flex: 0.3 }}>
                        <Card sx={{ height: '100%', overflow: 'auto' }}>
                            <CardContent>
                                <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} variant="fullWidth" sx={{ mb: 2 }}>
                                    <Tab label="Top Areas" />
                                    <Tab label="Area Details" />
                                </Tabs>

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
                                            {topAreas.map((area, index) => {
                                                // Find coordinates for this area
                                                const areaOption = areaOptions.find(opt => opt.wardCode === area.wardCode);
                                                return (
                                                    <ListItem
                                                        key={area.wardCode}
                                                        button
                                                        onClick={() => {
                                                            if (areaOption) {
                                                                flyToLocation(areaOption.longitude, areaOption.latitude, 9);
                                                                setPopupInfo({
                                                                    longitude: areaOption.longitude,
                                                                    latitude: areaOption.latitude,
                                                                    label: area.name,
                                                                    value: area.score
                                                                });
                                                                setSelectedArea(areaOption);
                                                                setTabIndex(1);
                                                            }
                                                        }}
                                                        sx={{
                                                            backgroundColor: index === 0 ? 'rgba(255, 0, 0, 0.1)' : 'transparent',
                                                            borderRadius: 1,
                                                            mb: 0.5,
                                                            cursor: areaOption ? 'pointer' : 'default'
                                                        }}
                                                    >
                                                        <ListItemText
                                                            primary={`${index + 1}. ${area.name}`}
                                                            secondary={`${scoreType === 'crimeScore' ? 'Crime Rate' : 'Negative Ratio'}: ${area.score.toFixed(2)}`}
                                                        />
                                                        {index === 0 && (
                                                            <Box component="span" sx={{ ml: 1 }}>
                                                                {scoreType === 'crimeScore' ?
                                                                    <WarningIcon color="error" /> :
                                                                    <MoodIcon sx={{ color: 'orange' }} />
                                                                }
                                                            </Box>
                                                        )}
                                                    </ListItem>
                                                );
                                            })}
                                        </List>
                                    </>
                                )}

                                {tabIndex === 1 && selectedArea && (
                                    <>
                                        <Typography variant="h6" gutterBottom>
                                            {selectedArea.label} - {selectedMonth}/{selectedYear}
                                        </Typography>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Top Crimes
                                        </Typography>
                                        <List dense>
                                            {topCrimes.length > 0 ? topCrimes.map((crime, idx) => (
                                                <ListItem key={crime.crime}>
                                                    <ListItemText
                                                        primary={`${idx + 1}. ${crime.crime}`}
                                                        secondary={`Incidents: ${crime.value}`}
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
                                            {totalDetectedCrime !== null ? totalDetectedCrime : 'N/A'}
                                        </Typography>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </Box>
                </Box>
            </Box>
        </>
    );
};

export default DisasterMap; 