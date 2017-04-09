const mongoose = require('mongoose');
const Profile = mongoose.model('Profile');

module.exports = {
    profileGet: (req, res) => {
        res.render('user/profile');
    }

};