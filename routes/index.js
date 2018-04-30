var express = require('express');
var passport = require('passport');

var Visitor = require('../models/visitor.js')

var router = express.Router();

// Load environment variables.
const dotenv = require('dotenv').config();

var env = {
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  AUTH0_DOMAIN: process.env.AUTH0_DOMAIN,
  AUTH0_CALLBACK_URL: 'https://' + process.env.PROJECT_DOMAIN + '/callback/'
};

let user = null;


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { env: env, user: req.user });
});

router.get('/api/visitors', function(req, res, next) {

  Visitor.find({}, function(err, docs) {
    if(err){
      console.log(err);
    }
    if (user) {
      const userId = user._json.sub.split('|')[1];
      res.json({ visitors: docs, userId: userId });
    }
    else {
      res.json({ visitors: docs });
    }
  });
});

router.post('/api/visitors', function(req, res) {
  if (user) {

    // Get Auth0 social id.
    const userId = user._json.sub.split('|')[1];
    // Get venue id.
    const venueId = req.body.venueId;
    // Construct doc.
    const doc = { userId, venueId };
    // Save doc.
    Visitor.create(doc, (err, newDoc) => {
      if (err) {
        throw err;
      }
      res.json({ error: false, data: newDoc });
    });
  }
  else {
    res.status(401).send('Unauthorized.');
  }
})

router.delete('/api/visitors', function(req, res) {
  if (user) {
    const userId = user._json.sub.split('|')[1];
    const venueId = req.body.venueId;

    Visitor.remove({ $and: [{ userId: userId }, { venueId: venueId }] }, function(err, numRemoved) {
      if (err) {
        throw err;
      }
      res.status(201).send('Successfully deleted reservation.');
    });
  }
  else {
    res.status(401).send('Unauthorized.');
  }
})

router.get('/clear', function(req, res) {
  Visitor.remove({}, { multi: true }, function(err, numRemoved) {
    if (err) {
      throw err;
    }
    console.log('Reservations removed:', numRemoved);
    res.redirect('/')
  });
})

router.get('/login', function(req, res) {
  res.render('login', { env: env });
});

router.get('/logout', function(req, res) {
  req.logout();
  user = null;
  res.redirect('/');
});

router.get('/callback',
  passport.authenticate('auth0', { failureRedirect: '/url-if-something-fails' }),
  function(req, res) {
    user = req.session.passport.user;
    res.redirect(req.session.returnTo || '/');
  });


module.exports = router;
