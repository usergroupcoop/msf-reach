import Promise from 'bluebird';

import { Router } from 'express';

// Import any required utility functions
import { cacheResponse, ensureAuthenticated } from '../../../lib/util';

import { searchTwitter, embedTweet } from '../../../lib/twitter.js';

// Import validation dependencies
import Joi from 'joi';
import validate from 'celebrate';

export default ({ logger }) => {
    let api = Router();

    // Get a list of all tweets matching the searchString
    api.get('/', ensureAuthenticated, cacheResponse('1 minute'),
        validate({
            query: {
                searchString: Joi.string().required()
            }
        }),
        (req, res, next) => searchTwitter(req.query.searchString)
            .then((data) => {
                let promiseArray = [];
                for (var i = 0; i < data.statuses.length; i++) {
                    promiseArray.push(embedTweet(data.statuses[i].id_str, 'https://twitter.com/'+data.statuses[i].user.screen_name+'/status/'+data.statuses[i].id_str));
                }
                Promise.all(promiseArray).then(function(resultArray) {
                    res.status(200).json({statusCode: 200, result:resultArray});
                });
                //.then((result) => res.status(200).json({ statusCode: 200, result: result }))

            })
            .catch((err) => {
                /* istanbul ignore next */
                logger.error(err);
                /* istanbul ignore next */
                next(err);
            })
    );

    return api;
};
