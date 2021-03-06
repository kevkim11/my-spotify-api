require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const VerifyToken = require('./auth/VerifyToken.js');
// const PORT = process.env.PORT || 5000;
let port = process.env.PORT || 8888;

const MongoClient = require('mongodb').MongoClient;
const mongoURI = process.env.MONGOURI;
const mongoDB = process.env.MONGODB;

const jwt = require('jsonwebtoken');
const AWS = require('aws-sdk');

const SpotifyWebApi = require('spotify-web-api-node');
const app = express();

// JWT Secret
const jwtSecret = process.env['JWT_SECRET'];
// AWS Secret
const awsAccessKeyId = process.env["AWS_ACCESS_KEY_ID"];
const awsSecretAccessKey = process.env["AWS_SECRET_ACCESS_KEY"];
const region = process.env["AWS_REGION"];

AWS.config.update({accessKeyId: awsAccessKeyId, secretAccessKey: awsSecretAccessKey, region: region});

/** Generates a random string containing numbers and letters of N characters */
const generateRandomString = N => (Math.random().toString(36)+Array(N).join('0')).slice(2, N+2);
// SPOTIFY Secret
const STATE_KEY = 'spotify_auth_state';
const clientId = process.env['SPOTIFY_CLIENT_ID'];
const clientSecret = process.env['SPOTIFY_CLIENT_SECRET'];
const refreshToken = process.env['SPOTIFY_REFRESH_TOKEN'];
const redirectUri = process.env['REDIRECT_URI'] || 'http://localhost:3000/callback';

let spotifyApi = new SpotifyWebApi({clientId : clientId,
                                    clientSecret : clientSecret,
                                    refreshToken: refreshToken,
                                    redirectUri: redirectUri});

// Mongodb Fields to exclude from when returning user to client
const fieldsToExclude = {
  access_token: 0,
  refresh_token: 0,
  country: 0,
  followers: 0,
  product: 0,
  type: 0,
  uri: 0,
  signed_in_at: 0,
  previous_last_played: 0
};

// Priority serve any static files.
app.use(cookieParser())
   .use(bodyParser.json())
   .use(bodyParser.urlencoded({ extended: true }));

//https://enable-cors.org/server_expressjs.html
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, x-access-token, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
  next();
});

let db;
MongoClient.connect(mongoURI, function(err, client) {
  if(err)return console.log(err);
  db = client.db(mongoDB);
  console.log(`Listening on port ${port}.`);
  app.listen(port, function () {
    console.error(`Node cluster worker: listening on port ${port}`);
  });
});

// Login using Spotify
app.get('/login', function(req, res) { // Spotify Request
  const state = generateRandomString(16);
  const scopes = ['user-read-private', 'user-read-email', 'user-read-recently-played'];//, 'user-top-read'
  res.cookie(STATE_KEY, state);
  console.log('AUTHORIZE URL= ',spotifyApi.createAuthorizeURL(scopes, state));
  res.redirect(spotifyApi.createAuthorizeURL(scopes, state));
});

app.get('/api/users', VerifyToken, (req, res) =>{
  // VERIFY TOKEN
  const id = req.userId;
  console.log('id in app.get(/api/users) = ', id);
  db.collection("user").findOne({"_id": id}, (err, currentUser)=>{
    if(err)return console.error("err:",err);
    res.status(200).json({user: currentUser})
  })
});

app.post('/api/users', (req, res)=>{
  const { code, state } = req.query;
  // const storedState = req.cookies ? req.cookies[STATE_KEY] : null;
  // if (state === null || state !== storedState) {
  //   console.log('there was an error, most likely state !== storedState');
  //   res.redirect('/#/error/state mismatch');
  //   // if the state is valid, get the authorization code and pass it on to the client
  // } else {
    res.clearCookie(STATE_KEY);
    let new_user = {}; // init empty new_user

    spotifyApi.authorizationCodeGrant(code).then(data => {
      const { expires_in, access_token, refresh_token } = data.body;
      console.log('access_token is', access_token);
      console.log('refresh token is', refresh_token);
      // Save the refresh_token to the new_user object
      new_user.access_token = access_token;
      new_user.refresh_token = refresh_token;
      // Set the access token on the API object to use it in later calls
      spotifyApi.setAccessToken(access_token); // use the access token to access the Spotify Web API
      spotifyApi.setRefreshToken(refresh_token);
      // Call .getMe() and store in User Collection
      spotifyApi.getMe().then(({ body }) => {
        const {id, country, display_name, email, external_urls, followers, href, images, product, type, uri} = body;
        console.log(body);
        new_user._id = id;
        new_user.country = country;
        new_user.display_name = display_name;
        new_user.email = email;
        new_user.external_urls = external_urls;
        new_user.followers = followers;
        new_user.href = href;
        new_user.images = images;
        new_user.product = product;
        new_user.type = type;
        new_user.uri = uri;
        new_user.signed_in_at = new Date(); // Update the user's signed_in_at field here
        return new_user
      }).then(new_user =>{
        // Querying by email / Might change to _id
        // 1) Update the user after they login
        db.collection("user").findOneAndUpdate(
          {email: new_user.email },
          {$set: new_user, $setOnInsert: {
              user_updated_at: new Date(),
              songs_updated_at: new Date(),
              created_at: new Date(),
              played_songs:[],
              previous_last_played: {}
            }},
          {upsert: true, returnOriginal: false, projection: fieldsToExclude},
          (err, doc)=>{
            if(err){return console.log("There was an error with findOneAndDelete: ", err)}
            const upserted_id = doc.lastErrorObject.upserted; // If user was created/upserted, will return doc.lastErrorObject.upserted
            // user was just created, so invoke Lambda
            if(upserted_id){
              const params = {
                InvocationType: "RequestResponse",
                FunctionName: 'user-sign-in', /* required */
                LogType: "Tail",
                Payload: JSON.stringify({id: upserted_id})
              };
              let lambda = new AWS.Lambda();

              lambda.invoke(params, (err, data)=>{
                const id = upserted_id;
                console.log('data', data);
                if (err) console.log(err, err.stack); // an error occurred
                else {
                  console.log('User.findOne');
                  console.log('id is', id);
                  db.collection("user").findOne({"_id": id}, {projection: fieldsToExclude} ,function(err, newUser){
                    if(err)return console.error(err);
                    if(!newUser){return res.status(404).json({message: "The user ID cannot be found..."})}
                    // JWT Token - create a token
                    else {
                      console.log('newUSER IS: ', newUser);
                      console.log('id is', id);
                      console.log('newUser._id is', newUser._id);

                      let token = jwt.sign({id: id}, jwtSecret);
                      res.json({user: newUser, token: token})
                    }
                  });
                }
              })
            } else {
              const user = doc.value;
              console.log('USER IS: ', user);
              const id = user._id;
              let token = jwt.sign({id: id}, jwtSecret);
              res.status(200).json({user: user, token: token})
            }
          }
        )
      });
    }).catch(err => {
      console.error(err);
      res.redirect('/#/error/invalid token');
    });
  // }
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