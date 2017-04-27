const Article = require('mongoose').model('Article');
const Category = require('mongoose').model('Category');
const User = require('mongoose').model('User');
const randomChars = require('./../utilities/encryption');
const fse = require('fs-extra');

function GenerateImgNameAndExtension(image) {
    if(image){
        let imageName = image.name.substring(0, image.name.lastIndexOf('.'));
        let imageExtension = image.name.substring(image.name.lastIndexOf('.') + 1);

        image.name = `${imageName}_${randomChars.generateSalt().substring(0, 8).replace('/\//g', 'ill')}.${imageExtension}`
    }
    
    return image;
}

function DeleteLocalImage(article) {
    let currentImageName = article.imagePath.substring(article.imagePath.lastIndexOf('/') + 1);
    let currentImagePath = `./public/uploads/ListingsImages/${currentImageName}`;

    fse.ensureFile(currentImagePath, err => {
        if (err) {
            console.log(err.message);
        } else {
            fse.remove(currentImagePath, err => {
                if (err) {
                    console.log(err.message);
                }
            })
        }
    })
}

module.exports = {
    createGet: (req, res) => {
        if (!req.isAuthenticated()) {
            let returnUrl = '/article/create';
            req.session.returnUrl = returnUrl;

            res.redirect('/user/login');
            return;
        }

        Category.find({}).then(categories => {
            res.render('article/create', {categories: categories});
        });
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
        if (image) {
            image.mv(`./public/uploads/ListingsImages/${finalImage.name}`, err => {
                if (err) {
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
            Category.findById(article.category).then(category => {
                res.render('article/details', {article, category});
            })
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
                if (isAdmin || req.user.isAuthor(article)) {
                    Category.find({}).then(categories => {
                        article.categories = categories;
                        
                        res.render('article/edit', article)
                    });
                    
                }
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
        if (image) {
            image.mv(`./public/uploads/ListingsImages/${finalImage.name}`, err => {
                if (err) {
                    console.log(err.message);
                }
            })

            // Delete previous image from local folder
            Article.findById({_id: id}).then(article => {
                DeleteLocalImage(article);
            })
        }


        let errorMsg = "";
        if (!articleArgs.title) {
            errorMsg = "Article title cannot be empty!";
        } else if (!articleArgs.content) {
            errorMsg = "Article content cannot be empty!";
        }

        if (errorMsg) {
            res.render('article/edit', {error: errorMsg});
        } else {
            Article.findById(id).populate('category').then(article => {
                if (article.category.id !== articleArgs.category) {
                    article.category.articles.remove(article.id)
                    article.category.save();
                }
         
                if(image){
                    article.category = articleArgs.category;
                    article.title = articleArgs.title;
                    article.content = articleArgs.content;     
                    article.imagePath = `/uploads/ListingsImages/${image.name}`           
                    article.price = articleArgs.price;       
                } else {
                    article.category = articleArgs.category;
                    article.title = articleArgs.title;
                    article.content = articleArgs.content;     
                    article.price = articleArgs.price;       
                }

                article.save((err) => {
                    if(err) {
                        console.log(err.message);
                    }
                })

                 Category.findById(article.category).then(category => {
                    if(category.articles.indexOf(article.id) === -1){
                        category.articles.push(article.id);
                        category.save();
                    } 
                    
                    res.redirect(`/article/details/${id}`);
                 })
            })
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