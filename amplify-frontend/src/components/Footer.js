import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

function Footer() {
  return (
    <Box component="footer" sx={{ py: 2, textAlign: 'center', bgcolor: 'background.paper', mt: 4 }}>
      <Typography variant="body2" color="text.secondary">
        &copy; {new Date().getFullYear()} Data Commons. All rights reserved.
      </Typography>
    </Box>
  );
}

export default Footer;
