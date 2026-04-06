import React from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';

export default function Header() {
  return (
    <AppBar 
      position="sticky" 
      elevation={0} 
      sx={{ bgcolor: '#172351',
        zIndex: 1200,
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }} >
            
      <Toolbar sx={{ minHeight: '70px', px: { xs: 2, md: 4 } }}>
        <Typography variant="h5" fontWeight="800" color="#ffffff" sx={{ letterSpacing: '-0.5px' }}>
          My Workspace
        </Typography>
      </Toolbar>
    </AppBar>
  );
}