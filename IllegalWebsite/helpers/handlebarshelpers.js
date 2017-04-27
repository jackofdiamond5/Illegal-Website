const Handlebars = require('hbs');

Handlebars.registerHelper('restrictSize', function(content) {
    if(content.length > 30){
        return content.substring(0, 30) + ". . .";
    }
    
    return content;
})  