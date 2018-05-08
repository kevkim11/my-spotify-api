require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const jwt = require('jsonwebtoken');
const AWS = require('aws-sdk');

const SpotifyWebApi = require('spotify-web-api-node');
const app = express();
// SPOTIFY Secret
const clientId = process.env['SPOTIFY_CLIENT_ID'];
const clientSecret = process.env['SPOTIFY_CLIENT_SECRET'];
const refreshToken = process.env['SPOTIFY_REFRESH_TOKEN'];

const redirectUri = process.env['REDIRECT_URI'] || 'http://localhost:3000/callback';
// JWT Secret
const jwtSecret = process.env['JWT_SECRET'];
// AWS Secret
const awsAccessKeyId = process.env["AWS_ACCESS_KEY_ID"];
const awsSecretAccessKey = process.env["AWS_SECRET_ACCESS_KEY"];
const region = process.env["AWS_REGION"];

// let credentials = {clientId : clientId, clientSecret : clientSecret, refreshToken: refreshToken};
let spotifyApi = new SpotifyWebApi({clientId : clientId,
                                    clientSecret : clientSecret,
                                    refreshToken: refreshToken});

// Priority serve any static files.
app.use(cookieParser())
   .use(bodyParser.json())
   .use(bodyParser.urlencoded({ extended: true }));

//https://enable-cors.org/server_expressjs.html
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/api/spotify', function(req, res) {
  console.log(spotifyApi);
  // console.log(`refreshToken is ${refreshToken}`);
  // console.log(`CLIENT SECRET is ${clientSecret}`);
  // console.log(`CLIENT ID is ${clientId}`);
  spotifyApi.refreshAccessToken()
    .then(function(data){
      spotifyApi.setAccessToken(data.body['access_token']);
    }, function(err) {
      console.log('Could not refresh access token', err);
    }).then(function(){
    let accessToken = spotifyApi.getAccessToken();
    console.log(`CURRENT ACCESSTOKEN: ${accessToken}`);
    let refreshToken = spotifyApi.getRefreshToken();
    console.log(`CURRENT REFRESHTOKEN: ${refreshToken}`);
    res.json([{accessToken}]);
  });
});



let port = process.env.PORT || 8888;
console.log(`Listening on port ${port}.`);
app.listen(port);