var express = require('express');
var router = express.Router();
var Page = require('../models/page');

router.get('/', function (req, res) {
    res.render('home', {
        title: 'Home'
    });
});

//exports
module.exports = router;