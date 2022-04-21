const express = require('express');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');

// ------------------------------------------------------------------------------
//  PASSPORT
// ------------------------------------------------------------------------------
const passport = require('passport');
const bCrypt = require('bCrypt');
const LocalStrategy = require('passport-local').Strategy;
const routes = require('./routes');
const config = require('./config');
const controllersdb = require('./controllersdb');
const User = require('./models');



passport.use('login', new LocalStrategy({
  passReqToCallback: true
},
  function (req, username, password, done) {
     User.findOne({ 'username': username },
      function (err, user) {
        
        if (err)
          return done(err);
        
        if (!user) {
          console.log('User Not Found with username ' + username);
          return done(null, false,
                             
            console.log('message', 'User Not found.'));
        }
       
        if (!isValidPassword(user, password)) {
          console.log('Invalid Password');
          return done(null, false,
            console.log('message', 'Invalid Password'));
        }
          return done(null, user);
      }
    );
  })
);

var isValidPassword = function (user, password) {
  return bCrypt.compareSync(password, user.password);
}

passport.use('signup', new LocalStrategy({
  passReqToCallback: true
},
  function (req, username, password, done) {
    findOrCreateUser = function () {
      // find a user in Mongo with provided username
      User.findOne({ 'username': username }, function (err, user) {
        // In case of any error return
        if (err) {
          console.log('Error in SignUp: ' + err);
          return done(err);
        }
        // already exists
        if (user) {
          console.log('User already exists');
          return done(null, false,
            //req.flash('message','User Already Exists'));
            console.log('message', 'User Already Exists'));
        } else {
          // create the user
          var newUser = new User();
          
          newUser.username = username;
          newUser.password = createHash(password);
          newUser.email = req.body.email;
          newUser.firstName = req.body.firstName;
          newUser.lastName = req.body.lastName;

          // save the user
          newUser.save(function (err) {
            if (err) {
              console.log('Error in Saving user: ' + err);
              throw err;
            }
            console.log('User Registration succesful');
            return done(null, newUser);
          });
        }
      });
    }
        process.nextTick(findOrCreateUser);
  })
)
// Generates hash using bCrypt
var createHash = function (password) {
  return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
}



passport.serializeUser(function (user, done) {
  done(null, user._id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});


// ------------------------------------------------------------------------------
//  EXPRESS
// ------------------------------------------------------------------------------

const app = express();
app.engine('.hbs', exphbs({ extname: '.hbs', defaultLayout: 'main.hbs' }));
app.set('view engine', '.hbs');


var port = process.env.PORT || 8080,
  ip = process.env.IP || '0.0.0.0';

app.use(express.static(__dirname + '/views'));
app.use(require('cookie-parser')());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(require('express-session')({
  secret: 'keyboard cat',
  cookie: {
    httpOnly: false,
    secure: false,
    maxAge: config.TIEMPO_EXPIRACION
  },
  rolling: true,
  resave: true,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(function (req, res, next) {
  next()
});

// ------------------------------------------------------------------------------
//  ROUTING GET POST
// ------------------------------------------------------------------------------
//  INDEX
app.get('/', routes.getRoot);

//  LOGIN
app.get('/login', routes.getLogin);
app.post('/login', passport.authenticate('login', { failureRedirect: '/faillogin' }), routes.postLogin);
app.get('/faillogin', routes.getFaillogin);

//  SIGNUP
app.get('/signup', routes.getSignup);
app.post('/signup', passport.authenticate('signup', { failureRedirect: '/failsignup' }), routes.postSignup);
app.get('/failsignup', routes.getFailsignup);


function checkAuthentication(req, res, next) {
  if (req.isAuthenticated()) {
    
    next();
  } else {
    res.redirect("/login");
  }
}

app.get('/ruta-protegida', checkAuthentication, (req, res) => {
 
  var user = req.user;
  console.log(user);
  res.send('<h1>Ruta OK!</h1>');
});


//  LOGOUT
app.get('/logout', routes.getLogout);

//  FAIL ROUTE
app.get('*', routes.failRoute);


// ------------------------------------------------------------------------------
//  LISTEN SERVER
// ------------------------------------------------------------------------------
controllersdb.conectarDB(config.URL_BASE_DE_DATOS, err => {

  if (err) return console.log('error en conexión de base de datos', err);
  console.log('BASE DE DATOS CONECTADA');

  app.listen(port, function (err) {
    if (err) return console.log('error en listen server', err);
    console.log(`Server running on port ${port}`);
  });
});
