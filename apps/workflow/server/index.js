const env = process.env.NODE_ENV || "development";
require('dotenv').config({ path: `.env.${env}` });

const express = require('express');
const app = express();
const cors = require('cors');

const workflowRoutes = require('./api/routes/workflows');
const actionRoutes = require('./api/routes/actions');
const stateRoutes = require('./api/routes/states');
const permissionRoutes = require('./api/routes/permissions');

const port = process.env.PORT || 5001;

app.use(
  cors({
    origin: process.env.BASE_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());

app.use('/scoop-portal/workflow-api/workflows', workflowRoutes);
app.use('/scoop-portal/workflow-api/actions', actionRoutes);
app.use('/scoop-portal/workflow-api/states', stateRoutes);  
app.use('/scoop-portal/workflow-api/permissions', permissionRoutes);

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});