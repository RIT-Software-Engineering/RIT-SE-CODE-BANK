const express = require('express');
const app = express();

require('dotenv').config();

const facultyRoutes = require('./express_testing/faculty_information_test');
app.use('/faculty', facultyRoutes);

const serviceRoutes = require('./express_testing/services_test');
app.use('/service', serviceRoutes);

// Test route (just to confirm server is alive)
app.get('/', (req, res) => {
  res.send('Server is running...');
});

// Start Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
