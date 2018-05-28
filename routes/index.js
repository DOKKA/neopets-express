var express = require('express');
var router = express.Router();
const rp = require('request-promise');
const cheerio = require('cheerio');
var Promise = require("bluebird");

function transform(body) {
  return cheerio.load(body);
}



function getOptions(searchTerm){
  return {
      uri: `https://items.jellyneo.net/search`,
      transform: transform,
      qs: {
          name: searchTerm,
          name_type: 3
      }
  }
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/prices', function(req, res, next) {
  //console.log(req.body)
  Promise.map(req.body['items[]'], (searchTerm)=>{
    return rp(getOptions(searchTerm))
     .then(function ($) {
         var price = $('.price-history-link').text();
         return {
             price: price,
             item: searchTerm
         }
     })
     .catch(function (err) {
         return {
             item: searchTerm
         }
     });
 
 }, {concurrency: 3}).then((obj)=>{
   res.json(obj)
 })
});

module.exports = router;
