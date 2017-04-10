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
    }
};

