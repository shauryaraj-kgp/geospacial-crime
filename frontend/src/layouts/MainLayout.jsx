import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
    Box, AppBar, Toolbar, Typography, Drawer, List, ListItem,
    ListItemButton, ListItemIcon, ListItemText, Divider, IconButton,
    Tooltip
} from '@mui/material';
import {
    Menu as MenuIcon, Map as MapIcon, Dashboard as DashboardIcon,
    BarChart as ReportsIcon, Settings as SettingsIcon,
    Build as PreDisasterIcon, Warning as PostDisasterIcon
} from '@mui/icons-material';

// Reduced drawer width to only fit icons
const drawerWidth = 60;

export default function MainLayout() {
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const drawer = (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            height: '100%'
        }}>
            {/* Main navigation items */}
            <List sx={{ width: '100%' }}>
                <Tooltip title="Dashboard" placement="right">
                    <ListItem disablePadding>
                        <ListItemButton
                            component="a"
                            href="/"
                            sx={{ justifyContent: 'center', py: 2 }}
                        >
                            <ListItemIcon sx={{ minWidth: 0 }}><DashboardIcon /></ListItemIcon>
                            <ListItemText primary="Dashboard" sx={{ display: 'none' }} />
                        </ListItemButton>
                    </ListItem>
                </Tooltip>

                <Tooltip title="Interactive Map" placement="right">
                    <ListItem disablePadding>
                        <ListItemButton
                            component="a"
                            href="/map"
                            sx={{ justifyContent: 'center', py: 2 }}
                        >
                            <ListItemIcon sx={{ minWidth: 0 }}><MapIcon /></ListItemIcon>
                            <ListItemText primary="Interactive Map" sx={{ display: 'none' }} />
                        </ListItemButton>
                    </ListItem>
                </Tooltip>

                <Tooltip title="Pre-Disaster Data" placement="right">
                    <ListItem disablePadding>
                        <ListItemButton
                            component="a"
                            href="/pre-disaster"
                            sx={{ justifyContent: 'center', py: 2 }}
                        >
                            <ListItemIcon sx={{ minWidth: 0 }}><PreDisasterIcon /></ListItemIcon>
                            <ListItemText primary="Pre-Disaster Data" sx={{ display: 'none' }} />
                        </ListItemButton>
                    </ListItem>
                </Tooltip>
            </List>

            {/* Spacer to push settings to bottom */}
            <Box sx={{ flexGrow: 1 }} />

            {/* Settings at the bottom */}
            <List sx={{ width: '100%' }}>
                <Tooltip title="Settings" placement="right">
                    <ListItem disablePadding>
                        <ListItemButton
                            component="a"
                            href="/settings"
                            sx={{ justifyContent: 'center', py: 2 }}
                        >
                            <ListItemIcon sx={{ minWidth: 0 }}><SettingsIcon /></ListItemIcon>
                            <ListItemText primary="Settings" sx={{ display: 'none' }} />
                        </ListItemButton>
                    </ListItem>
                </Tooltip>
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    backgroundColor: 'rgb(240, 240, 240)',
                    width: { sm: `calc(100% - ${drawerWidth}px)` }
                }}

            >
                <Outlet />
            </Box>
        </Box>
    );
}