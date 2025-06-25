import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

function About() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>About</Typography>
      <Typography variant="body1" paragraph>
        This Data Commons is a professional platform for sharing, analyzing, and visualizing mental health data. Built with AWS Amplify, React, and Material-UI.
      </Typography>
    </Box>
  );
}

export default About;
