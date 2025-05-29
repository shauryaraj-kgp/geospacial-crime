import React from 'react';
import ScotlandMap from '../components/ScotlandMap';
import '../styles/MapPage.css'


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

const MapPage = () => {
    return (
        <div className="map-wrapper">
            <header className="map-header">
                <h1>Scotland Interactive Crime Map</h1>
                <p>
                    needs fixing
                </p>
            </header>
            <Box sx={{ height: '100vh' }}>
                <ScotlandMap />
            </Box>
        </div>
    );
};

export default MapPage;
