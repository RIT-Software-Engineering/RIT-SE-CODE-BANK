require('dotenv').config({ path: '.env' });

const express = require('express');
const app = express();
const cors = require('cors');

const workflowRoutes = require('./api/routes/workflows');
const actionRoutes = require('./api/routes/actions');
const stateRoutes = require('./api/routes/states');
const permissionRoutes = require('./api/routes/permissions');
const tagRoutes = require('./api/routes/tags');

const port = process.env.PORT || 5001;

const allowedOrigins = []
if (process.env.BASE_URL) allowedOrigins.push(process.env.BASE_URL)
if (process.env.CMT_URL) allowedOrigins.push(process.env.CMT_URL)
if (process.env.CMT_URL_STAGING) allowedOrigins.push(process.env.CMT_URL_STAGING)

app.use(
  cors({
    origin: allowedOrigins || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());

app.use('/workflows', workflowRoutes);
app.use('/actions', actionRoutes);
app.use('/states', stateRoutes);  
app.use('/tags', tagRoutes);
app.use('/permissions', permissionRoutes);
app.use('/scoop-portal/workflow-api/workflows', workflowRoutes);
app.use('/scoop-portal/workflow-api/actions', actionRoutes);
app.use('/scoop-portal/workflow-api/states', stateRoutes);  
app.use('/scoop-portal/workflow-api/permissions', permissionRoutes);

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});