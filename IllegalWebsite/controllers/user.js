const User = require('mongoose').model('User');
const Role = require('mongoose').model('Role');
const encryption = require('./../utilities/encryption');

function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

module.exports = {
    registerGet: (req, res) => {
        res.render('user/register');
    },

    registerPost: (req, res) => {
        let registerArgs = req.body;

        User.findOne({email: registerArgs.email}).then(user => {
            let errorMsg = '';
            if (user) {
                errorMsg = 'User with the same username exists!';
            } else if (registerArgs.password !== registerArgs.repeatedPassword) {
                errorMsg = 'Passwords do not match!'
            }

            if (errorMsg) {
                registerArgs.error = errorMsg;
                res.render('user/register', registerArgs)
            } else {
                let salt = encryption.generateSalt();
                let passwordHash = encryption.hashPassword(registerArgs.password, salt);

                let roles = [];
                Role.findOne({name: 'User'}).then(role => {
                    roles.push(role.id);

                    let userObject = {
                        email: registerArgs.email,
                        passwordHash: passwordHash,
                        fullName: registerArgs.fullName,
                        salt: salt,
                        roles: roles
                    };

                    if(!validateEmail(userObject.email)){
                        res.render('user/register', {error: "Invalid email!"}); 
                    } else {
                        userObject.roles = roles;
                        User.create(userObject).then(user => {
                            user.prepareInsert();
                            req.logIn(user, (err) => {
                                if (err) {
                                    registerArgs.error = err.message;
                                    res.render('user/register', registerArgs);
                                    return;
                                }
                                res.redirect('/')
                            })
                        })   
                    }
                });
            }
        });
    },

    loginGet: (req, res) => {
        res.render('user/login');
    },

    loginPost:(req, res) => {
        let loginArgs = req.body;
        User.findOne({email: loginArgs.email}).then(user => {
            if (!user || !user.authenticate(loginArgs.password)) {
                let errorMsg = 'Either username or password is invalid!';
                loginArgs.error = errorMsg;
                res.render('user/login', loginArgs);
                return;
            }

            req.logIn(user, (err) => {
                if (err) {
                    console.log(err);
                    res.render('/user/login', {error: err.message});
                    return;
                }

                let returnUrl = '/';
                if (req.session.returnUrl) {
                    returnUrl = req.session.returnUrl;
                    delete req.session.returnUrl;
                }

                res.redirect(returnUrl);
            })
        })
    },

    logout: (req, res) => {
        req.logOut();
        res.redirect('/');
    },

    userProfileGet: (req, res) => {
        if(!req.isAuthenticated()){
            res.redirect('/user/login');
        }
        else{
            res.render('user/profile');
        }
    },

    userProfilePost: (req, res) => {
        let image = req.files.profilePic;
        

        res.render('user/profile');
    }
};
