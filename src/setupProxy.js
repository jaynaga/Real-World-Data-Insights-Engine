const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/fuji',
    createProxyMiddleware({
      target: 'http://localhost:1071',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('Proxying request to F-UJI:', req.method, req.url);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('F-UJI response:', proxyRes.statusCode);
      }
    })
  );
};
