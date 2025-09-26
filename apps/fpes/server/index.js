const express = require('express');
const app = express();

require('dotenv').config();
// app.use(express.json()); // <-- needed for POST/PUT JSON bodies

const facultyRoutes = require('./routes/faculty_routes.js');
app.use('/faculty', facultyRoutes);

const serviceRoutes = require('./routes/service_routes.js');
app.use('/services', serviceRoutes);

const grantsRoutes = require('./routes/grants_routes.js')
app.use('/grants', grantsRoutes);

const courseSectionRoutes = require('./routes/course_section_routes.js');
app.use('/course_sections', courseSectionRoutes);

const studentSupportRoutes = require('./routes/atudetn_support_routes.js');
app.use('/student_support', studentSupportRoutes);

// Test route (just to confirm server is alive)
app.get('/', (req, res) => {
  res.send('Server is running...');
});

// Start Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
