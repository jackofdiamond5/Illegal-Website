const mongoose = require('mongoose');
const Profile = mongoose.model('Profile');


module.exports = {
    profileGet: (req, res) => {
        if(!req.isAuthenticated()){
            res.redirect('/user/login');
        }
        else{
            res.render('user/profile');
        }
    },

    profilePost: (req, res) => {
        let id = req.user.id;
        
        res.end('Not done yet');
    }
};

