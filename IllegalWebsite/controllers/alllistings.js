const mongoose = require('mongoose');
const Article = mongoose.model('Article');

module.exports = {
    allListings: (req, res) => {
        Article.find({}).populate('author').then(articles => {
            res.render('home/listings',{articles: articles});
        })
    }
};