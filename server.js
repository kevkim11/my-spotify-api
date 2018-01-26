const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');
const app = express();

const clientId = process.env['SPOTIFY_CLIENT_ID'];
const clientSecret = process.env['SPOTIFY_CLIENT_SECRET'];
const refreshToken = process.env['SPOTIFY_REFRESH_TOKEN'];

// let credentials = {clientId : clientId, clientSecret : clientSecret, refreshToken: refreshToken};
let spotifyApi = new SpotifyWebApi({clientId : clientId,
                                    clientSecret : clientSecret,
                                    refreshToken: refreshToken});

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
console.log(`Listening on port ${port}.`)
app.listen(port);