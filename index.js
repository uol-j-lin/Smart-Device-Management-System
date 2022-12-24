var http = require("http");

const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const mysql = require("mysql");
const port = 8089;

app.use(bodyParser.urlencoded({ extended: true }));

require("./routes/main")(app);

app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.engine("html", require("ejs").renderFile);

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Sinusoid123456",
  database: "devices"
});

// Connect to the database
db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log("Connected to the database.");
})
global.db = db;

app.listen(port, () => console.log(`App listening on port ${port}!`));

// Static files

app.use(express.static('public'));
app.use('/css', express.static(__dirname+'public/css'));
app.use('/img', express.static(__dirname+'public/img'));