import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Container } from '@mui/material';
import theme from './theme';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import DataCatalog from './pages/DataCatalog';
import Visualizations from './pages/Visualizations';
import About from './pages/About';
import AuthWrapper from './components/AuthWrapper';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthWrapper>
        <Navbar />
        <Container maxWidth="lg" sx={{ minHeight: '80vh', py: 4 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<DataCatalog />} />
            <Route path="/visualizations" element={<Visualizations />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </Container>
        <Footer />
      </AuthWrapper>
    </ThemeProvider>
  );
}

export default App;
