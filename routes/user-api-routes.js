
const request = require("request");
var db = require("../models");
var moment = require("moment");
const nodemailer = require("nodemailer");
const firebase = require("firebase");
const axios = require("axios");
const fbApp = require("../config/fb-config");

module.exports = function (app) {
  app.get("/signup", function (req, res) {
    res.render("signup", { title: "Signup Page" });
  });

  // goes to
  app.get("/movie-dinner", function (req, res) {
    res.render("movie-dinner", {
      title: "Movie-Dinner"
    });
  });

  // POST route for new user
  app.post("/signup", function (req, res) {
    
    
    var email = req.body.email;
    var password = req.body.pswd;
    var displayName = req.body.displayName;
    console.log(password);
    fbApp.createUserWithEmailAndPassword(email, password)
      .then((data) => {
        const uid = data.uid
        db.User.create({
          displayName: displayName,
          email: email,
        }).then(function (dbUser) {
          console.log(dbUser);
          res.json({loggedInUser: dbUser.displayName, loggedInUserId: dbUser.id});
        });
      })
      .catch(function (error) {
        res.statusCode = 404;
      });
     
  });

  app.post("/api/authenticate", function (req, res) {
    console.log(req.body.email, req.body.pswd)
    fbApp
      .signInWithEmailAndPassword(req.body.email, req.body.pswd)
      .then((data) => {
        console.log(data)
        
        db.User.findOne({
          where: {
           email: req.body.email
          },
          }).then(function(dbUser) {
           res.json({loggedIn: true, loggedInUser: dbUser["dataValues"]["displayName"], loggedInUserId: dbUser["dataValues"]["id"]});
          }).catch((err) => {
            console.log(err);
            res.json({loggedIn: true, loggedInUser: null, loggedInUserId: null});
          });
      })
      .catch((err) => {
        res.json({loggedIn: false});
      });
  });

  app.get("/dashboard", function(req,res) {
    const user = firebase.auth().currentUser;
    if (user) {
      db.User.findOne({
        where: {
          email: user.email,
        },
      }).then(function(user) {
        db.Movie.findAll({
          where: {UserId : user.id},
        }).then(function(data) {
            
          moviesToReturn = [];
          for (var i = 0; i < data.length; i++) { 
              if (moviesToReturn.indexOf(data[i].dataValues.genreName) == -1) {
                moviesToReturn.push(data[i].dataValues.genreName);            
              }
          }         
          var hbsObject = {
            movies: moviesToReturn,
            //movies:movieList.genreName,
            email: user.email,
            displayName: user.displayName
          };
        
          res.render("dashboard", hbsObject);
        });
      })   
    }
  });

  app.post("/add-movie-dinner", function (req, res) {
    var genreId = req.body.genreId;
    var genreName = req.body.genreName;

    const user = firebase.auth().currentUser;
    if (user) {
      db.User.findOne({
        where: {
          email: user.email,
        },
      }).then(function(user) {
        db.Movie.create({
          genreId: genreId,
          genreName: genreName,
          UserId: user.id
        }).then(function (res) {
          console.log(res);
        });
      });
    }
  });

  app.get("/", function (req, res) {
    res.render("login", { title: "Signin Page" });
  });

  //find all users
  app.get("/api/users", function(req, res) {
    
    db.User.findAll({
      include: [db.Movie]
    }).then(function(dbUser) {
      res.json(dbUser);
    });
  });

  app.get("/api/movies", function(req, res) {
    
    db.Movie.findAll({
      include: [db.User]
    }).then(function(dbUser) {
      res.json(dbUser);
    });
  });

  //find user by Id
  app.get("/api/users/:id", function(req, res) {
   db.User.findOne({
     where: {
      id: req.params.id
     },
     include: [db.Movie]
     }).then(function(dbUser) {
      res.json(dbUser);
     });
  });

  app.get("/api/movies/:id", function(req, res) {
   db.Movie.findOne({
       where: {
         id: req.params.id
       },
       include: [db.User]
     }).then(function(dbMovie) {
       res.json(dbMovie);
    });
   });
 
  //Need to be fix minor connection issue
  app.get("/send", function(req, res){

    res.render("send", { title: "email Page" });
  });
  //POST route for nodemailer
  app.post("/send", function (req, res) {
    
     db.User.findOne({
      // var recipient =req.body.email;

       where: {
         email: req.body.email,
       },
       include: [db.Movie]
    }).then(function (result) {
      console.log(result);
      var genreId = result.genreId;
      var today = moment().format("YYYY-MM-DD");
       var queryURL = "https://api.themoviedb.org/3/discover/movie?api_key=" + process.env.TMDB_API_KEY + "&language=en-US&region=US&sort_by=release_date.asc&include_video=false&page=1&primary_release_date.gte=" + today + "&with_genres=" + genreId;

       request(queryURL, function (error, response, body) {
         console.log("error:", error); // Print the error if one occurred
         console.log("statusCode:", response && response.statusCode); // Print the response status code if a response was received
         var moviesBody = JSON.parse(body);   
         var imgToEmail = " <img src='https://image.tmdb.org/t/p/w500/" + movies[i].poster_path; + "' />";     
        console.log("Nodemailer sending to: " + result.email);

         let transporter = nodemailer.createTransport({
           service: "gmail",
           auth: {
             user: "yousue891@gmail.com",
             pass: "Tha,bto7",
           },
           tls: {
             rejectUnauthorized: false,
           },
         });

         let mailOptions = {
          from: "yousue891@gmail.com",
          replyTo: "youseu891@gmail.com",
           to: recipient,
           subject: "Here are the movies you requested!",
           text: "'" + moviesBody.results[0].title + "', Release Date: " + moviesBody.results[0].release_date
                      };

        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent");
          }
        });

        console.log("Movies successfully sent: " + moviesBody);

        res.send(true);
      });
    });  
  });
  //  axios code


  app.get("/api/movie-dinner/genres", function(req, res){
    var genreId = req.body.genreId;
    var genreName = req.body.genreName;
    genreApi(genreId, genreName, data => {
      //console.log(data);
      res.json(data);
    });
    function genreApi(genreId, genreName, callback){
      var api_key = process.env.TMDB_API_KEY;        
      var queryURL = `https://api.themoviedb.org/3/genre/movie/list?api_key=${api_key}&language=en-US`;  
      axios({
        url: queryURL,
        method: "GET",
      })
        .then(function (response) {
          // console.log(response);
          callback(response.data);
        })
        .catch(function (err) {
          console.error(err);
        });
      }
   });

  app.get("/api/movie-dinner/movies", function(req, res){
    movieApi();
    function movieApi(){
      var api_key = process.env.TMDB_API_KEY; 
      var today = moment().format('YYYY-MM-DD');
      var genreId = req.query.genreId;

      var URL =`https://api.themoviedb.org/3/discover/movie?api_key=${api_key}&language=en-US&region=US&sort_by=release_date.asc&include_video=false&page=1&primary_release_date.gte=${today}&with_genres=${genreId}`;
      axios({
        url: URL,
        method: "GET",
      })
        .then(function (response) {
          res.json(response.data);
        })
        .catch(function (err) {
          console.error(err);
        });
      }
    });

}
