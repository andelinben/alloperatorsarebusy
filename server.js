/* Setting things up. */
var path = require('path'),
    express = require('express'),
    app = express(),   
    helpers = require(__dirname + '/helpers.js'),
    twitter = require(__dirname + '/twitter.js');

app.use(express.static('public'));


/* You can use uptimerobot.com or a similar site to hit your /BOT_ENDPOINT to wake up your app and make your Twitter bot tweet. */

app.all("/" + process.env.BOT_ENDPOINT, function (req, res) {

  twitter.find_a_tweet(function(tweet){
    twitter.retweet(tweet.id_str);
  });

});

var listener = app.listen(process.env.PORT, function () {
  console.log('Your bot is running on port ' + listener.address().port);
});
