const express = require("express");
const app = express();
require("dotenv").config();
const PORT = process.env.PORT || 3000;
// const app = require("./app");

const connnectToDb = require("./dbConnection");

connnectToDb();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
