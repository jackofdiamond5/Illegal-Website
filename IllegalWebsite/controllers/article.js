const Article = require('mongoose').model('Article');
const randomChars = require('./../utilities/encryption');

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

        let image = req.files.image;
        let imageName = image.name.substring(0, image.name.lastIndexOf('.'));
        let imageExtension = image.name.substring(image.name.lastIndexOf('.') + 1);

        image.name = `${imageName}_${randomChars
            .generateSalt()
            .substring(0, 8)
            .replace('/\//g', 'ill')}.${imageExtension}`;
        
        if(image){
            image.mv(`./public/uploads/ListingsImages/${image.name}`, err => {
                if(err){
                    console.log(err.message);
                }
            })

            articleArgs.imagePath = `/uploads/${image.name}`;
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

        let errorMsg = "";
        if (!articleArgs.title) {
            errorMsg = "Article title cannot be empty!";
        } else if (!articleArgs.content) {
            errorMsg = "Article content cannot be empty!";
        }

        if (errorMsg) {
            res.render('article/edit', {error: errorMsg});
        } else {
            Article.update({_id: id}, {$set: {title: articleArgs.title, content: articleArgs.content}})
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
            res.redirect('/')

        });
    }
};