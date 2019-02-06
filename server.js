/////////////////////////////////////////THIS IS A TEST SERVER FOR A TEST APPLICATION////////////////////
////////////////////////////////////////********************************************//////////////////*/

var express = require("express");
var app = express();
var http = require("http");
var server = http.Server(app);
var bodyParser = require("body-parser");
var urlencode = require("urlencode");
var config = require("./config.js");
var events = require("events");
var mysql = require("mysql");

//

var createSql = require("./lib/sqlTables/createTables.js");
var handleSql = require("./lib/sqlTables/handleSql.js");

var myLogger = function(req, res, next) {
  setHead(res);
  next();
};

app.set("views", __dirname + "/views/public");
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(myLogger);

var server_port = 5000;
//|| 5000
var server_ip_address = "0.0.0.0";
///
var storeOtp = new Array(); //Test Otp storage

var pool = mysql.createPool(config.mysql);
createSql.createTables(pool);
global.eventEmit = new events.EventEmitter();

app.get("/", function(req, res, next) {
  res.render("index");
});

app.post("/generateOtp", function(req, res) {
  var options = {
    host: config.credentials.host,
    path: "/send?" + getReqData(req, config)
  };
  console.log(options);
  http.request(options, callback).end();
  eventEmit.once("otp", function(data) {
    res.json(data);
  });
});

app.post("/confirmOtp", (req, res) => {
  //confirm otp with user name from DB in production
  if (storeOtp[req.body.User_Otp]) {
    delete storeOtp[req.body.User_Otp];
    res.json({ status: true, message: "Permission Granted" });
  } else {
    res.json({ status: false, message: "Wrong Otp" });
  }
});

app.post("/submitData", (req, res) => {
  if (req.body) {
    handleSql.manageQueries(
      pool,
      req.body,
      "submitData",
      SchemaName.User.Schema,
      function(status, result) {
        if (status) {
          res.json({
            status: true,
            message: "Successfully submitted the data"
          });
        } else {
          console.log(result);
          res.json({ status: false, message: "Could not save the data" });
        }
      }
    );
  } else {
    res.json({ status: false, message: "No Data sent" });
  }
});

server.listen(server_port, server_ip_address, function() {
  console.log(
    "Listening on server_port and ip  " +
      server_port +
      "   " +
      server_ip_address
  );
});

callback = function(response) {
  var str = ""; //another chunk of data has been recieved, so append it to `str`
  response.on("data", function(chunk) {
    str += chunk;
  }); //the whole response has been recieved, so we just print it out here
  response.on("end", function() {
    console.log(str);
    if (JSON.parse(str).status == "success") {
      eventEmit.emit("otp", { status: true, message: "Otp generated." });
    } else {
      eventEmit.emit("otp", {
        status: false,
        message: "Could not generate the Otp"
      });
    }
  });
};

function getReqData(req, config) {
  let myOtp = generateOtp();
  storeOtp[myOtp] = myOtp; //store it in DB but for the test lets store it here
  var msg = urlencode(
    req.body.User_Name + " " + config.credentials.msg + myOtp
  );
  var toNumber = req.body.User_Number;
  var username = config.credentials.username;
  var hash = config.credentials.hash; // The hash key could be found under Help->All Documentation->Your hash key. Alternatively you can use your Textlocal password in plain text.
  var sender = config.credentials.sender;
  var data =
    "username=" +
    username +
    "&hash=" +
    hash +
    "&sender=" +
    sender +
    "&numbers=" +
    toNumber +
    "&message=" +
    msg;
  return data;
}

function setHead(res) {
  // Website you wish to allow connection- * (all)
  res.setHeader("Access-Control-Allow-Origin", "*");
  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
}

function generateOtp() {
  return require("generate-password").generate({
    length: 4,
    numbers: true
  });
}
