require('dotenv').config({ path: '.env' });

const express = require('express');
const app = express();
const cors = require('cors');

const workflowRoutes = require('./api/routes/workflows');
const actionRoutes = require('./api/routes/actions');
const stateRoutes = require('./api/routes/states');
const permissionRoutes = require('./api/routes/permissions');

const port = process.env.PORT || 3000;

app.use(
  cors({
    origin: process.env.BASE_URL || "http://localhost:3001",
    credentials: true,
  }),
);
app.use(express.json());

app.use('/workflows', workflowRoutes);
app.use('/actions', actionRoutes);
app.use('/states', stateRoutes);  
app.use('/permissions', permissionRoutes);

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});