import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

function Home() {
  return (
    <Box className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <Typography variant="h3" gutterBottom className="text-center">
        Welcome to the Data Commons
      </Typography>
      <Typography variant="body1" paragraph className="text-center max-w-md">
        Explore, analyze, and visualize mental health data using our secure, cloud-powered platform.
      </Typography>
    </Box>
  );
}

export default Home;