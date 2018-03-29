import Promise from 'bluebird';

// request functionality
import request from 'request';

// twitter search functionality
import Twitter from 'twitter';

// Config
import config from '../config';

// TODO rate limit of 180 searches per 15 mins
// TODO exclude tweets already saved


// set up Twitter client with credentials
const client = new Twitter({
    consumer_key: config.TWITTER_CONSUMER_KEY,
    consumer_secret: config.TWITTER_CONSUMER_SECRET,
    access_token_key: config.TWITTER_ACCESS_KEY,
    access_token_secret: config.TWITTER_ACCESS_SECRET
});

/**
 * search Twitter
 * @function searchTwitter
 * @param {string} queryTerm - term to search by
 */
const searchTwitter = (queryTerm) => new Promise((resolve, reject) => {
    // search
    client.get('search/tweets', {q: queryTerm + ' -filter:retweets -from:petabencana', geocode: '-5,120,3000km'}, function(error, tweets, response) {
        if (error) reject(error + ': ' + response);
        resolve(tweets);
    });
});

/**
 * tweet embedding
 * @function embedTweet
 * @param {string} queryTerm - term to search by
 */

const embedTweet = (tweetId, tweetURL) => new Promise((resolve, reject) => {
    request('https://publish.twitter.com/oembed?url='+tweetURL+'&omit_script=true', function (err, response, body){
        if (!err){
            if (response.headers['content-type'] === 'application/json; charset=utf-8'){
                resolve({tweetId:tweetId, tweetEmbed: JSON.parse(body)});
            }
        }
        else {
            reject (err+': '+response);
        }
    });
});

module.exports = {searchTwitter, embedTweet};
