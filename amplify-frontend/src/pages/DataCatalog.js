import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';

function DataCatalog() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Data Catalog</Typography>
      <Paper sx={{ p: 2 }}>
        <Typography variant="body1">
          Browse and search available datasets. (Integration with Amplify API coming soon.)
        </Typography>
      </Paper>
    </Box>
  );
}

export default DataCatalog;
