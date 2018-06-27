var config = {
      twitter: {
        username: process.env.BOT_USERNAME,
     /* Be sure to update the .env file with your API keys.
        See how to get them: https://botwiki.org/tutorials/how-to-create-a-twitter-app */
        consumer_key: process.env.CONSUMER_KEY,
        consumer_secret: process.env.CONSUMER_SECRET,
        access_token: process.env.ACCESS_TOKEN,
        access_token_secret: process.env.ACCESS_TOKEN_SECRET
      }
    },
    fs = require('fs'),
    Twit = require('twit'),
    T = new Twit(config.twitter);
    const unique = require('unique-random-array')
    const querystring = unique(process.env.QUERY_STRING.split(','))

module.exports = {
  tweet: function(text, cb){
    T.post('statuses/update', { status: text }, function(err, data, response) {
      cb(err, data, response);
    });    
  },
  post_image: function(text, image_base64, cb) {
   T.post('media/upload', { media_data: image_base64 }, function (err, data, response) {
      if (err){
        console.log('ERROR:\n', err);
        if (cb){
          cb(err);
        }
      }
      else{
        console.log('tweeting the image...');
        T.post('statuses/update', {
          status: text,
          media_ids: new Array(data.media_id_string)
        },
        function(err, data, response) {
          if (err){
            console.log('ERROR:\n', err);
            if (cb){
              cb(err);
            }
          }
          else{
            console.log('tweeted');
            if (cb){
              cb(null);
            }
          }
        });
      }
    });
  },  
  update_profile_image: function(image_base64, cb) {
    console.log('updating profile image...');
    T.post('account/update_profile_image', {
      image: image_base64
    },
    function(err, data, response) {
      if (err){
        console.log('ERROR:\n', err);
        if (cb){
          cb(err);
        }
      }
      else{
        if (cb){
          cb(null);
        }
      }
    });
  },
  delete_last_tweet: function(cb){
    console.log('deleting last tweet...');
    T.get('statuses/user_timeline', { screen_name: process.env.BOT_USERNAME }, function(err, data, response) {
      if (err){
        if (cb){
          cb(err, data);
        }
        return false;
      }
      if (data && data.length > 0){
        var last_tweet_id = data[0].id_str;
        T.post(`statuses/destroy/${last_tweet_id}`, { id: last_tweet_id }, function(err, data, response) {
          if (cb){
            cb(err, data);
          }
        });
      } else {
        if (cb){
          cb(err, data);
        }
      }
    });
  },
  retweet: function(tweet_id){
    T.post('statuses/retweet/:id',
      {
        id: tweet_id
      }, function(err, data, response) {
        if (err){
          console.log('There was an error!\n-----\n' + err.message + '\n-----');
          var stream = fs.createWriteStream(__dirname + "/tweet_ids.txt", {flags:'a'});
          stream.write(tweet_id);
          stream.write("\n");
          stream.end();
        } else{
          console.log('Retweeted! ') + tweet_id;
          var stream = fs.createWriteStream(__dirname + "/tweet_ids.txt", {flags:'a'});
          stream.write(tweet_id + "\n");
          stream.end();
        }
      }
    );
  },
  find_a_tweet: function(cb){
    console.log('looking for tweet to retweet...')
    var previous_tweets = [];
    var doquery = function() {
    
      var query = querystring()
      console.log(process.env.QUERY_STRING)
      console.log(query)
    
      T.get('search/tweets',
        {
          q: query,
          result_type: 'mixed',
          lang: 'en',
          filter: 'safe',
          count: 20
        },
        (err, data, response) => {
          if (err) {
            console.log('Error while querying: ', err);
          } else {
            var found_one = false;
            for (var ii = 0; ii < data.statuses.length; ++ii) {
              if(data.statuses[ii].in_reply_to_user_id != process.env.USER_ID && !previous_tweets.includes(data.statuses[ii].id)) {
                if (cb) {
                  cb(data.statuses[ii]);
                }
                found_one = true;
                break;
              }
            }
            if (!found_one) {
              console.log('Failed to find a tweet');
            }
          }
        }
      );
    };
    

    fs.readFile(__dirname + '/tweet_ids.txt', 'utf8', function (err, data) {
      if (err){
        console.log('Error', err);
      }
      else {
        if (data.trim().length){
          previous_tweets = data.trim().split('\n').map(function(idStr){
            return parseInt(idStr);
          });

          if (typeof previous_tweets === 'int'){
            previous_tweets = [previous_tweets];
          }
        }
        doquery();
      }
    });

  }
};
