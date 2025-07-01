require('dotenv').config({ path: '.env' });

const express = require('express');
const app = express();
const cors = require('cors');
const cookieParser = require("cookie-parser");
const rubricsRouter = require('./api/routes/rubrics.js');
const usersRouter = require('./api/routes/users.js');
const accessRouter = require('./api/routes/access.js');

const port = process.env.PORT || "5000"; // You can use any port number

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
app.use("/rubrics", rubricsRouter);
app.use("/users", usersRouter);
app.use("/access", accessRouter);

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});