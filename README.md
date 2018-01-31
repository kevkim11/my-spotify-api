# My Spotify API Server

Server to get an access token using my refresh token.

Used by my react app: https://spotify-wall.herokuapp.com/

## Development mode

In development mode, it assumes you are running the frontend on localhost:3000, but the server itself will be running on localhost:8888.

In order to start developing, register a Spotify Application here:
https://developer.spotify.com/my-applications

After you register you will get a `client_id` and `client_secret`

Go to 
https://github.com/spotify/web-api-auth-examples 
and run the `authorization_code/app.js` using your `client_id` and `client_secret`
to get an `access_token` and `refresh_token`. You will need the `refresh_token`.

Write the commands below in your local terminal (replacing XXXX, YYYY, and ZZZZ with your acutal client id, secret, and refresh token from the page where you registered your application)

```
export SPOTIFY_CLIENT_ID=XXXX
export SPOTIFY_CLIENT_SECRET=YYYY
export SPOTIFY_REFRESH_TOKEN=ZZZZ
npm start
```


## Deploying to production


This template is indended to be deployed on Heroku. After installing the heroku CLI tools you can run the below commands in the same directory as server.js(replacing XXXX, YYYY, ZZZZ with your actual credentials - the below example assume that you already have your frontend running on http://myfrontend.herokuapp.com (i.e. https://spotify-wall.herokuapp.com/)).
```
heroku create mybackend
heroku config:set SPOTIFY_CLIENT_ID=XXXX
heroku config:set SPOTIFY_CLIENT_SECRET=YYYY
heroku config:set SPOTIFY_REFRESH_TOKEN=ZZZZ
git push heroku master
```

You should now be able to go to http://myfrontend.herokuapp.com and have the API properly working. 
