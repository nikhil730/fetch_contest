const express = require("express");
const path = require("path");
const emailjs = require("@emailjs/nodejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fetch = require("node-fetch");
const nodemailer = require("nodemailer");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname + "../public")));
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(express.static("public"));
app.use(bodyParser.json());
dotenv.config();

mongoose
  .connect(process.env.connection_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })

  .then(() => {
    console.log("MongoDB Connected…");
  })
  .catch((err) => console.log(err));

const emailschema = new mongoose.Schema({
  email: {
    type: String,
    reuired: true,
  },
});

const Email = mongoose.model("Email", emailschema);

var new_saved = false;
var already_saved = false;
// Email.find().then((email) => {
//   email.forEach((emai) => {
//     //console.log(emai.email);
//   });
// });
function fetchdata() {
  fetch("https://kontests.net/api/v1/all")
    .then((response) => response.json())
    .then((body) => {
      let contests = body;
      contests.map(function (contest) {
        const startDateTime = contest.start_time;
        const endDateTime = contest.end_time;
        const startDate = new Date(startDateTime).toLocaleDateString("en-US");
        const startTime = new Date(startDateTime).toLocaleTimeString("en-US");
        const endDate = new Date(endDateTime).toLocaleDateString("en-US");
        const endTime = new Date(endDateTime).toLocaleTimeString("en-US");
        if (contest.site === "CodeChef" || contest.site === "LeetCode") {
          if (contest.in_24_hours === "Yes") {
            Email.find().then((email) => {
              email.forEach((emaill) => {
                const to_email = emaill.email;
                emailjs
                  .send(
                    process.env.service_id,
                    process.env.template_id,
                    {
                      site: contest.site + ":- " + contest.name,
                      from: startDate + " " + startTime,
                      to: endDate + " " + endTime,
                      link: contest.url,
                      to_email: to_email,
                      reply_to: "nikhilbhalla196@gmail.com",
                    },
                    {
                      publicKey: process.env.user_id,
                      privateKey: process.env.private_id,
                    }
                  )
                  .then(
                    function (response) {
                      console.log("SUCCESS!", response.status, response.text);
                    },
                    function (err) {
                      console.log("FAILED...", err);
                    }
                  );
              });
            });
          }
        }
      });
    });
}

setInterval(fetchdata, 60000 * 60 * 12);

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.post("/", function (req, res) {
  const email_id = req.body.email;
  Email.findOne({ email: email_id }).then((foundEmail) => {
    if (!foundEmail) {
      if (email_id.length !== 0) {
        const emaill = new Email({
          email: email_id,
        });
        emaill.save();
        new_saved = true;
      }
    } else {
      already_saved = true;
    }
    res.redirect("/prompt");
  });
  console.log("here");
});

app.get("/prompt", function (req, res) {
  if (new_saved) {
    new_saved = false;
    res.render("Prompt", {
      text: "New Email saved",
    });
  } else if (already_saved) {
    already_saved = false;
    res.render("Prompt", {
      text: "Email already saved",
    });
  }
});

app.listen(3000, function () {
  console.log("Server is runing at Port 3000");
});
