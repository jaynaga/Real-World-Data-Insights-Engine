import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';

function Visualizations() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Visualizations</Typography>
      <Paper sx={{ p: 2 }}>
        <Typography variant="body1">
          Interactive dashboards and charts will appear here. (Connect to QuickSight or embed visualizations.)
        </Typography>
      </Paper>
    </Box>
  );
}

export default Visualizations;
