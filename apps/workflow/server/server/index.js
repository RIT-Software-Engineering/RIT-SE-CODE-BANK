require('dotenv').config({ path: '.env' });

const express = require('express');
const app = express();
const cors = require('cors');
const cookieParser = require("cookie-parser");

const workflowRoutes = require('./api/routes/workflows');
const actionRoutes = require('./api/routes/actions');
const stateRoutes = require('./api/routes/states');
const permissionRoutes = require('./api/routes/permissions');
const userRoutes = require('./api/routes/users');

const port = process.env.PORT || 3000;

app.use(function (req, res, next) {
  // res.header("Access-Control-Allow-Origin", "*");
  // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  // Required for SSO authentication
  // TODO: This may no longer be needed because of our cors policy lower down "credentials: true".
  res.header("Access-Control-Allow-Credentials", "true");

  next();
});
app.use(
  cors({
    origin: process.env.BASE_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());

app.use('/workflows', workflowRoutes);
app.use('/actions', actionRoutes);
app.use('/states', stateRoutes);  
app.use('/permissions', permissionRoutes);
app.use('/users', userRoutes);

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});