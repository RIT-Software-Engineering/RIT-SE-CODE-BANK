const express = require('express');
const cors = require('cors');
const app = express();

require('dotenv').config();
// app.use(express.json()); // <-- needed for POST/PUT JSON bodies
app.use(express.json());
app.use(cors());

const facultyRoutes = require('./routes/faculty_routes.js');
app.use('/faculty', facultyRoutes);

const serviceRoutes = require('./routes/service_routes.js');
app.use('/services', serviceRoutes);

const grantsRoutes = require('./routes/grants_routes.js')
app.use('/grants', grantsRoutes);

const courseSectionRoutes = require('./routes/course_section_routes.js');
app.use('/course_sections', courseSectionRoutes);

const studentSupportRoutes = require('./routes/student_support_routes.js');
app.use('/student_support', studentSupportRoutes);

const coursesRoutes = require('./routes/courses_routes.js');
app.use('/courses', coursesRoutes);

const departmentRoutes = require('./routes/departments_routes.js');
app.use('/departments', departmentRoutes);

const publicationsRoutes = require('./routes/publications_routes.js');
app.use('/publications', publicationsRoutes)

const highlightsRoutes = require('./routes/highlights_routes.js');
const { rebuildTables } = require('./api/rebuild_tables.js');
app.use('/highlights', highlightsRoutes);

const formsRoutes = require('./routes/forms_routes.js');
app.use('/forms', formsRoutes);

const fileUploadRoutes = require('./routes/file_upload_routes.js');
app.use('/file', fileUploadRoutes);


// Test route (just to confirm server is alive)
app.get('/', (req, res) => {
  res.send('Server is running...');
});


app.post("/db/init", async (req,res) => {
  let response;
  try{
    response = await rebuildTables();
    res.send("Tables successfully rebuilt!")
  } catch (err){
    console.log(err)
    res.status(500).send("An error occured while trying to rebuild the tables : " + err);
  }
  
})

// Start Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

