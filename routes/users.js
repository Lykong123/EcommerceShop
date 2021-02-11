var express = require('express');
var router = express.Router();
var passport = require('passport');
var bcrypt = require('bcryptjs');
//get users model
var User = require('../models/user');

//get user register
router.get('/register', function(req, res){
    res.render('register', {
        title: 'Register'
    })
})

//post user register
router.post('/register', function (req, res) {
    var name = req.body.name;
    var email = req.body.email;
    var password = req.body.password;
    var password2 = req.body.password2;
    req.checkBody('name', 'Name is required!').notEmpty();
    req.checkBody('email', 'Email is required!').isEmail();
    req.checkBody('password', 'Password is required!').notEmpty();
    req.checkBody('password2', 'Passwords do not match!').equals(password);

    let error = [];
    if (password.length < 4) {
        error.push({ msg: 'Password must be at least 4 characters' });
    }

    var errors = req.validationErrors();
    if (errors) {
        res.render('register', {
            errors: errors,
            user: null,
            title: 'Register'
        });
    } else {
        User.findOne({email: email}, function (err, user) {
            if (err)
                console.log(err);
            if (user) {
                req.flash('danger', 'Username exists, choose another!');
                res.redirect('/users/register');
            } else {
                var user = new User({
                    name: name,
                    email: email,
                    password: password,
                    admin: 0
                });
                bcrypt.genSalt(10, function (err, salt) {
                    bcrypt.hash(user.password, salt, function (err, hash) {
                        if (err)
                            console.log(err);
                        user.password = hash;
                        user.save(function (err) {
                            if (err) {
                                console.log(err);
                            } else {
                                req.flash('success', 'You are now registered!');
                                res.redirect('/users/login')
                            }
                        });
                    });
                });
            }
        });
    }
});

//get login
router.get('/login', function (req, res) {

    if (res.locals.user) res.redirect('/');
    
    res.render('login', {
       title: 'Log in'
    });

});

router.post('/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    req.checkBody('email', 'Email is required!').isEmail();
    req.checkBody('password', 'Password is required!').notEmpty();
    console.log(email);
    console.log(password);
    //Check if username is exist
    User.findOne({email: email}).then(result => {
      if(result) {
      // if user exist, check given password with the encrypted password
      bcrypt.compare(password, result.password, function(err, passwordIsMatch) {
          console.log(result);
          console.log(passwordIsMatch);
        if(passwordIsMatch) {
           console.log(passwordIsMatch);
          //  if password is correct, return success, with cookie save
          res.cookie('email', email, {expire: 3600 * 1000});
          res.cookie('logged-time', new Date().toISOString(), {expire: 3600 * 1000});
          //  store user information to session
          req.session.userId = result._id;
          req.session.email= result.email;
          console.log(req.session.userId)
          res.redirect("/");
        } else {
         // else return fail
          res.render("login", {error: true, message: "Password incorrect"});
        }
      })
    } else {
      //if user is not exist, return fail
    }
  }).catch(err => {
    console.log(err);
  })
});
  

//get logout
router.get('/logout', function (req, res) {
    req.logout();
    req.flash('success', 'You are logged out!');
    res.redirect('/users/login');

});

// Exports
module.exports = router;