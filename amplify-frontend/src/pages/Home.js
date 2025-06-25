import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

function Home() {
  return (
    <Box>
      <Typography variant="h3" gutterBottom>Welcome to the Data Commons</Typography>
      <Typography variant="body1" paragraph>
        Explore, analyze, and visualize mental health data using our secure, cloud-powered platform.
      </Typography>
    </Box>
  );
}

export default Home;
