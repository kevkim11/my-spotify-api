// require('dotenv').config();
let jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
// var config = require('../config'); // get our config file
const jwtSecret = process.env['JWT_SECRET'];

function verifyToken(req, res, next) {

  // check header or url parameters or post parameters for token
  // console.log("REQUEST IN VERIFYTOKEN", req);
  const token = req.headers['x-access-token'];
  console.log('token IS ',token);
  if (!token)
    return res.status(403).send({ auth: false, message: 'No token provided.' });

  // verifies secret and checks exp
  jwt.verify(token, jwtSecret, function(err, decoded) {
    if (err)
      return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });

    // if everything is good, save to request for use in other routes
    req.userId = decoded.id;
    console.log('the decoded ID is', decoded.id);
    console.log('the decoded is', decoded);
    next();
  });

}

function verifyToken2(req, res, next) {

  // check header or url parameters or post parameters for token
  const token = req.headers['x-access-token'];
  if (!token)
    return res.status(403).send({ auth: false, message: 'No token provided.' });

  // verifies secret and checks exp
  jwt.verify(token, jwtSecret, function(err, decoded) {
    if (err)
      return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });

    // if everything is good, save to request for use in other routes
    req.userId = decoded.id;
    next();
  });

}

module.exports = verifyToken;