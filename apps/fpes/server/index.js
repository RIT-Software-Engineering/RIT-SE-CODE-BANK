const express = require('express');
const app = express();

require('dotenv').config();

const facultyRoutes = require('./express_testing/faculty_information_test');
app.use('/faculty', facultyRoutes);

const serviceRoutes = require('./routes/service_routes.js');
app.use('/service', serviceRoutes);

const grantsRoutes = require('./routes/grants_routes.js')
app.use('/grants', grantsRoutes);

// Test route (just to confirm server is alive)
app.get('/', (req, res) => {
  res.send('Server is running...');
});

// Start Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
