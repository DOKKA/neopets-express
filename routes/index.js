var express = require('express');
var router = express.Router();
const rp = require('request-promise');
const cheerio = require('cheerio');
var Promise = require("bluebird");

var redis = require('redis');
var client = redis.createClient();

function getAsync(key){
    return new Promise((resolve, reject)=>{
        client.get(key, (err, result)=>{
            if(err){
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

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

function mapFn(searchTerm){
    return getAsync(searchTerm).then((value)=>{
        if(value != null){
            return {
                price: value,
                item: searchTerm
            };
        } else {
            return rp(getOptions(searchTerm)).then(function ($) {
                var price = $('.price-history-link').text();
                client.set(searchTerm, price, 'EX', 86400);
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
        }
    });
    
}



/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/prices', function(req, res, next) {
  Promise.map(req.body['items[]'], mapFn, {concurrency: 3}).then((obj)=>{
   res.json(obj)
 });
});

module.exports = router;
