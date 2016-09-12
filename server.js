var mongoose = require('mongoose');
var express = require('express');
var passport = require('passport');
var path = require('path');
var waterfall = require('async-waterfall');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var ipaddress = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;

var app = express();

mongoose.connect(process.env.MONGODB_URL + 'club', { db: { nativeParser: true } });
app.use(require('serve-static')(__dirname + '/../../public'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('body-parser').json());
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.set('json spaces', 2);

var userSchema = mongoose.Schema({
  name: String,
  email: String,
  clubs: [String]
}, { collection: 'users' });
var clubSchema = mongoose.Schema({
  name: String,
  short: String,
  long: String,
  pics: [String],
  founder: String,
  members: [String]
}, { collection: 'clubs' });

var User = mongoose.model('User', userSchema);
var Club = mongoose.model('Club', clubSchema);

var reg = new RegExp('(?:[a-z][a-z]+)@charterschool\\.org');

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: 'get ur own key',
    clientSecret: 'this key is mine',
    callbackURL: "http://club-charterhelper.rhcloud.com/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    if(reg.test(profile.emails[0].value)){
      User.find({ email: profile.emails[0].value }, function (err, users) {
        if(users.length != 0)
          return done(null, users[0]);
        else {
          var user = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            clubs: []
          });
          user.save(function(err, user) {
            return done(err, user);
          });
        }
      });
    }
    else
      return done(null, false);
  }
));

function loggedIn(req, res, next) {
  if (req.user) {
    next();
  }
  else {
    res.redirect('/auth/google');
  }
}

app.get('/', loggedIn, function(req, res, next) {
  res.redirect('/clubs/cards');
});

app.get('/clubs/cards', loggedIn, function(req, res, next) {
  res.sendFile(path.join(__dirname, '/html', 'club-cards.html'));
});
app.get('/clubs/new', loggedIn, function(req, res, next){
  res.sendFile(path.join(__dirname, '/html', 'new.html'));
});

app.get('/account', loggedIn, function(req, res, next) {
  res.sendFile(path.join(__dirname, '/html', 'account.html'));
});

app.get('/accountData', loggedIn, function(req, res, next) {
  res.setHeader('Content-Type', 'application/json');
  res.contentType('application/json');
  var list = [];
  var requestIDs = { $in: [] };
  req.user.clubs.forEach(function(entry){
    requestIDs.$in.push(mongoose.Types.ObjectId(entry));
  });
  Club.find({_id:requestIDs}, function(err, clubs) {
    console.log(clubs);
    clubs.forEach(function (entry) {
      list.push({id: entry.id, name: entry.name});
    });
    res.send(JSON.stringify({name: req.user.name, email: req.user.email, clubs: list}));
  });
});
app.get('/clubData', loggedIn, function(req, res, next){
  res.setHeader('Content-Type', 'application/json');
  res.contentType('application/json');
  Club.find({}, function(err,clubs){
    var data = [];
    var inClub = false;
    for(var i = 0; i < clubs.length; i++) {
      if(clubs[i].members.indexOf(req.user.id) != -1)
        inClub = true;
      else
        inClub = false;
      data.push({
        id: clubs[i].id,
        name: clubs[i].name,
        short: clubs[i].short,
        long: clubs[i].long,
        pics: clubs[i].pics,
        members: clubs[i].members.length,
        inClub: inClub
      });
    }
    res.send(JSON.stringify({ data: data }));
  });
});
app.post('/oneClubData', loggedIn, function(req, res, next) {
  res.setHeader('Content-Type', 'application/json');
  res.contentType('application/json');
  console.log(req.body);
  Club.findById(req.body.id, function(err, club){
    var list = [];
    var requestIDs = { $in: [] };
    club.members.forEach(function(entry){
      requestIDs.$in.push(mongoose.Types.ObjectId(entry));
    });
    var inClub = false;
    if(club.members.indexOf(req.user.id) != -1)
      inClub = true;
    User.find({_id:requestIDs}, function(err, users) {
      console.log(users);
      users.forEach(function (entry) {
        list.push({name: entry.name, email: entry.email});
      });
      res.send(JSON.stringify({name: club.name, short: club.short, long: club.long, pics: club.pics, members: list, id: club.id, inClub: inClub}));
    });
  });
});
app.post('/subscribe', loggedIn, function(req, res, next){
  Club.findById(req.body.id, function(err, club) {
    club.members.push(req.user.id);
    club.save();
    req.user.clubs.push(club.id);
    req.user.save();
    res.send(JSON.stringify({status: 0}));
  });
});
app.post('/unsubscribe', loggedIn, function(req, res, next){
  console.log(req.body.id);
  Club.findById(req.body.id, function(err, club) {
    var index = club.members.indexOf(req.user.id);
    if (index > -1) {
      club.members.splice(index, 1);
    }
    club.save(function (err, club) {
        index = req.user.clubs.indexOf(club.id);
        if (index > -1) {
          req.user.clubs.splice(index, 1);
        }
        req.user.save(function(err, user){
          res.send(JSON.stringify({status: 0}));
        });
      }
    );
  });
});
app.post('/newClub', loggedIn, function(req, res, next){
  var club = new Club({
    name: req.body.name,
    short: req.body.short,
    long: req.body.long,
    pics: req.body.pics,
    founder: req.user.name,
    members: [req.user.id]
  });
  club.save(function(err, club){
    req.user.clubs.push(club.id);
    req.user.save(function(err,club){
      res.send(JSON.stringify({ status: 0 }));
    });
  });
});

app.get('/failure', function(req, res){
  res.sendFile(path.join(__dirname, '/html', 'fail.html'));
});

app.get('/secret', function(req,res){
  res.sendFile(path.join(__dirname, '/html', 'secret.html'));
});

app.get('/js/*', function(req,res) {
  res.sendFile(path.join(__dirname, req.url));
});
app.get('/css/*', function(req,res) {
  res.sendFile(path.join(__dirname, req.url));
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['email', 'profile'] }));
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/failure' }),
  function(req, res) {
    res.redirect('/');
  });
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.listen(port, ipaddress);
