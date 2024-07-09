const express = require('express');
const path = require('path');

const app = express();
const port = 8080;

// Redirect /admin to /iso_chatbot/
app.get('/admin', (req, res) => {
  res.redirect('/iso_chatbot/');
});

// Serve static files from the dist directory
app.use('/iso_chatbot', express.static(path.join(__dirname, 'dist')));

// Handle SPA (Single Page Application)
app.get('/iso_chatbot/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}/iso_chatbot/`);
});
