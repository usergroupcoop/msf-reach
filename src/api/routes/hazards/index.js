import { Router } from 'express';

// Import any required utility functions
import { cacheResponse, ensureAuthenticated } from '../../../lib/util';

import { PDC } from '../../../lib/pdc-georss.js';
import { USGS } from '../../../lib/usgs-georss.js';
import { TSR } from '../../../lib/tsr.js';
import { GDACS } from '../../../lib/gdacs-georss.js';
import { PTWC } from '../../../lib/ptwc-georss.js';



export default ({ logger }) => {
    let api = Router();

    // Get a list of all reports
    api.get('/pdc', ensureAuthenticated, cacheResponse('10 minutes'),
        (req, res, next) => PDC()
            .then((events) => {
                res.status(200).json({statusCode: 200, time:new Date().toISOString(), result:events});
            })
            .catch((err) => {
                /* istanbul ignore next */
                logger.error(err);
                /* istanbul ignore next */
                next(err);
            })
    );

    // The following get methods get hazards from different data sources
    api.get('/usgs', ensureAuthenticated, cacheResponse('10 minutes'),
        (req, res, next) => USGS()
            .then((events) => {
                res.status(200).json({statusCode: 200, time:new Date().toISOString(), result:events});
            })
            .catch((err) => {
                /* istanbul ignore next */
                logger.error(err);
                /* istanbul ignore next */
                next(err);
            })
    );

    api.get('/tsr', ensureAuthenticated, cacheResponse('10 minutes'),
        (req, res, next) => TSR()
            .then((events) => {
                res.status(200).json({statusCode: 200, time:new Date().toISOString(), result:events});
            })
            .catch((err) => {
                /* istanbul ignore next */
                logger.error(err);
                /* istanbul ignore next */
                next(err);
            })
    );

    api.get('/gdacs', ensureAuthenticated, cacheResponse('10 minutes'),
        (req, res, next) => GDACS()
            .then((events) => {
                res.status(200).json({statusCode: 200, time:new Date().toISOString(), result:events});
            })
            .catch((err) => {
                /* istanbul ignore next */
                logger.error(err);
                /* istanbul ignore next */
                next(err);
            })
    );

    api.get('/ptwc', ensureAuthenticated, cacheResponse('10 minutes'),
        (req, res, next) => PTWC()
            .then((events) => {
                res.status(200).json({statusCode: 200, time:new Date().toISOString(), result:events});
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
