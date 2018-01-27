# My Spotify API Server

Server to get an access token using my refresh token.

Used by my react app: https://spotify-wall.herokuapp.com/

## Development mode

In development mode, it assumes you are running the frontend on localhost:3000, but the server itself will be running on localhost:8888.

In order to start developing, register a Spotify Application here:
https://developer.spotify.com/my-applications

Write the below commands in your terminal (replacing XXXX, YYYY, and ZZZZ with your acutal client id, secret, and refresh token from the page where you registered your application)

```
export SPOTIFY_CLIENT_ID=XXXX
export SPOTIFY_CLIENT_SECRET=YYYY
export SPOTIFY_REFRESH_TOKEN=ZZZZ
npm start
```


## Deploying to production


This template is indended to be deployed on Heroku. After installing the heroku CLI tools you can run the below commands in the same directory as server.js(replacing abc123, cba456, ZZZZ with your actual credentials - the below example assume that you already have your frontend running on http://myfrontend.herokuapp.com (i.e. https://spotify-wall.herokuapp.com/)).
```
heroku create mybackend
heroku config:set SPOTIFY_CLIENT_ID=abc123
heroku config:set SPOTIFY_CLIENT_SECRET=cba456
heroku config:set SPOTIFY_REFRESH_TOKEN=ZZZZ
git push heroku master
```

You should now be able to go to http://myfrontend.herokuapp.com and have the API properly working. 
