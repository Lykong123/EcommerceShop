var express = require('express');
var router = express.Router();

//get page model
var Page = require('../models/page');

//get home page
router.get('/', function (req, res) {
    res.render('home', {
        title: 'Home'
    });
});

//get a page
//create slug to render all related page
router.get('/:slug', function(req, res){
    var slug = req.params.slug;

    Page.findOne({slug: slug}, function(err, page){
        if(err)
            console.log(err);
        if(!page){
            res.redirect('/');
        }else{
            res.render('index', {
                title: page.title,
                content: page.content 
            })
        }   
    })
})
//exports
module.exports = router;