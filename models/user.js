var mongoose = require('mongoose');

//user schema
var UserSchema = mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    admin: {
        type: Number
    }
},{collection: "users"});

var User = module.exports = mongoose.model('User', UserSchema);