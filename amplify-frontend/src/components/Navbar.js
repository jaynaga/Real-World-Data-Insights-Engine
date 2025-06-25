import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Link as RouterLink } from 'react-router-dom';
import Link from '@mui/material/Link';

function Navbar() {
  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Data Commons
        </Typography>
        <Button color="inherit" component={RouterLink} to="/">Home</Button>
        <Button color="inherit" component={RouterLink} to="/catalog">Data Catalog</Button>
        <Button color="inherit" component={RouterLink} to="/visualizations">Visualizations</Button>
        <Button color="inherit" component={RouterLink} to="/about">About</Button>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
