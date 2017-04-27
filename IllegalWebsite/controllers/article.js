const Article = require('mongoose').model('Article');
const User = require('mongoose').model('User');
const randomChars = require('./../utilities/encryption');
const fse = require('fs-extra');

function GenerateImgNameAndExtension(image) {
    let imageName = image.name.substring(0, image.name.lastIndexOf('.'));
    let imageExtension = image.name.substring(image.name.lastIndexOf('.') + 1);

    image.name = `${imageName}_${randomChars.generateSalt().substring(0, 8).replace('/\//g', 'ill')}.${imageExtension}`;

    return image;
}

function DeleteLocalImage(article) {
    let currentImageName = article.imagePath.substring(article.imagePath.lastIndexOf('/') + 1);
    let currentImagePath = `./public/uploads/ListingsImages/${currentImageName}`;

    fse.ensureFile(currentImagePath, err => {
        if(err) {
            console.log(err.message);
        } else {
            fse.remove(currentImagePath, err => {
                if(err) {
                    console.log(err.message);
                }
            })
        }
    })
}

module.exports = {
    createGet: (req, res) => {
        res.render('article/create');
    },

    createPost: (req, res) => {
        let articleArgs = req.body;
        
        let errorMsg = '';
        if (!req.isAuthenticated()) {
            errorMsg = 'You should be logged in to make articles!'
        } else if (!articleArgs.title) {
            errorMsg = 'Invalid title!';
        } else if (!articleArgs.content) {
            errorMsg = 'Invalid content!';
        }

        if (errorMsg) {
            res.render('article/create', {error: errorMsg});
            return;
        }

        

        // Get image from request and generate name
        let image = req.files.image;
        let finalImage = GenerateImgNameAndExtension(image);

        // Upload image to local folder   
        if(image){
            image.mv(`./public/uploads/ListingsImages/${finalImage.name}`, err => {
                if(err){
                    console.log(err.message);
                }
            })

            // Save new image path to database
            articleArgs.imagePath = `/uploads/ListingsImages/${finalImage.name}`;
        }

        articleArgs.author = req.user.id;
        Article.create(articleArgs).then(article => {
            article.prepareInsert();
            res.redirect('/');
        })

    },

    details: (req, res) => {
        let id = req.params.id;

        Article.findById(id).populate('author').then(article => {
            res.render('article/details', article);
        });

    },


    editGet: (req, res) => {
        let id = req.params.id;

        if (!req.isAuthenticated()) {
            let returnUrl = `article/edit/${id}`;
            req.session.returnUrl = returnUrl;

            res.redirect('/user/login');
            return;
        }

        Article.findById(id).then(article => {
            req.user.isInRole('Admin').then(isAdmin => {
                if (!isAdmin && !req.user.isAuthor(article)) {
                    res.redirect('/');
                    return;
                }
        
                res.render('article/edit', article);
            })
        })
    },

    editPost: (req, res) => {
        let id = req.params.id;

        let articleArgs = req.body;

        // Get image from request and generate name
        let image = req.files.image;
        let finalImage = GenerateImgNameAndExtension(image);

        // Upload image to local folder   
        if(image){
            image.mv(`./public/uploads/ListingsImages/${finalImage.name}`, err => {
                if(err){
                    console.log(err.message);
                }
            })
        }

        // Delete previous image from local folder
        Article.findById({_id: id}).then(article => {
            DeleteLocalImage(article);
        })

        let errorMsg = "";
        if (!articleArgs.title) {
            errorMsg = "Article title cannot be empty!";
        } else if (!articleArgs.content) {
            errorMsg = "Article content cannot be empty!";
        }

        if (errorMsg) {
            res.render('article/edit', {error: errorMsg});
        } else {
            Article.update({_id: id}, {$set: {
                title: articleArgs.title,
                content: articleArgs.content,
                imagePath: `/uploads/ListingsImages/${image.name}`}
            })
                .then(updateStatus => {
                    res.redirect(`/article/details/${id}`);
                });
        }
    },

    deleteGet: (req, res) => {
        let id = req.params.id;

        if (!req.isAuthenticated()) {
            let returnUrl = `/article/delete/${id}`;
            req.session.returnUrl = returnUrl;

            res.redirect('/user/login');
            return;
        }

        Article.findById(id).then(article => {
            req.user.isInRole('Admin').then(isAdmin => {
                if (!isAdmin && !req.user.isAuthor(article)) {
                    res.redirect('/');
                    return;
                }
            })

            res.render('article/delete', article);
        })
    },

    deletePost: (req, res) => {
        let id = req.params.id;

        Article.findOneAndRemove({_id: id}).then(article => {
            article.prepareDelete();
            DeleteLocalImage(article);
            res.redirect('/');
        });
    }
};