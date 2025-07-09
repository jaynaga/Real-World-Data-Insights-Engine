import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light', // You can toggle this dynamically for dark mode
    primary: {
      main: '#3b82f6', // accent-light
    },
    secondary: {
      main: '#60a5fa', // accent-dark
    },
    background: {
      default: '#f9fafb', // card-light
      paper: '#ffffff',  // surface-light
    },
    text: {
      primary: '#111827', // textPrimary-light
      secondary: '#6b7280', // textSecondary-light
    },
    divider: '#e5e7eb', // border-light
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
});

export default theme;
