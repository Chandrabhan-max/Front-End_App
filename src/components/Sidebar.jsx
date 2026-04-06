import { Link, useLocation } from 'react-router-dom';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Box } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CategoryIcon from '@mui/icons-material/Category';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

export default function Sidebar() {
    const { pathname } = useLocation();

    const menu = [
        { name: 'Dashboard', path: '/', icon: <DashboardIcon /> },
        { name: 'Master', path: '/master', icon: <CategoryIcon /> },
        { name: 'Billing', path: '/billing', icon: <ReceiptIcon /> },
        { name: 'Bulk Upload', path: '/master/bulk-upload', icon: <CloudUploadIcon /> } 
    ];

    let activePath = "";
    menu.forEach(item => {
        if (pathname === item.path || pathname.startsWith(item.path + '/')) {
            if (item.path.length > activePath.length) {
                activePath = item.path;
            }
        }
    });

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: 240,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: 240,
                    boxSizing: 'border-box',
                    background: '#f8f9fa',
                    borderRight: '1px solid #e0e0e0'
                },
            }}
        >
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', height: '64px' }}>
                <Typography variant="h6" fontWeight="bold" color="#1e1b4b">
                    Billing APP
                </Typography>
            </Box>
            <List sx={{ px: 2 }}>
                {menu.map((m) => {
                    const isActive = activePath === m.path; 

                    return (
                        <ListItem key={m.path} disablePadding sx={{ mb: 1 }}>
                            <ListItemButton
                                component={Link}
                                to={m.path}
                                sx={{
                                    borderRadius: '8px',
                                    backgroundColor: isActive ? '#eef2ff' : 'transparent',
                                    color: isActive ? '#4f46e5' : '#4b5563',
                                    '&:hover': { backgroundColor: '#eef2ff' }
                                }}
                            >
                                <ListItemIcon sx={{ color: isActive ? '#4f46e5' : '#9ca3af', minWidth: '40px' }}>
                                    {m.icon}
                                </ListItemIcon>
                                <ListItemText primary={m.name} primaryTypographyProps={{ fontWeight: isActive ? 600 : 500 }} />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
        </Drawer>
    );
}