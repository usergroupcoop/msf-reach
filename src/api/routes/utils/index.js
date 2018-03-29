import { Router } from 'express';


// Import any required utility functions
import { cacheResponse } from '../../../lib/util';

// Import validation dependencies
import Joi from 'joi';
import validate from 'celebrate';

//AWS s3
import {S3} from 'aws-sdk';

//uuid generator
const uuidv4 = require('uuid/v4');


export default ({ config, db, logger }) => { // eslint-disable-line no-unused-vars
    let api = Router();

    // set up the s3 signature version and region
    let s3= new S3(
        {
            signatureVersion: 'v4',
            region: config.AWS_S3_REGION
        });

    // get a signed s3 upload url
    api.get('/uploadurl', cacheResponse('1 minute'), validate({
        query: {
            filename: Joi.string().required(),
            _:Joi.any() //jQuery adds this when cache=false?
            //	mime: Joi.string().required()
        }
    }),
    (req, res, next) => {
        let uid=uuidv4();
        let s3params = {
            Bucket: config.AWS_S3_BUCKETNAME,
            Key: 'tests/' +uid+'/'+ req.query.filename
        //ContentType:req.query.mime
        };
        s3.getSignedUrl('putObject', s3params, (err, data) => {
            if (err){
                logger.error('could not get signed url from S3');
                logger.error(err);
                next(err);
            } else {
                var returnData = {
                    signedRequest : data,
                    url: data.substr(0,data.indexOf('?'))  //OR: 'https://s3-'+config.AWS_S3_REGION+'.amazonaws.com/'+ config.AWS_S3_BUCKETNAME+'/'+ s3params.Key ?
                };
                //write the url into the db under image_url for this card
                res.send(returnData);
            }
        });

    });

    // update report with AI image labels
    api.post('/updateimagelabels',(req,res,next)=>{

        let params=req.body;
        // make sure API key is supplied and matches
        if (req.headers['x-api-key'] === config.API_KEY)
        {
            let query = `UPDATE ${config.TABLE_REPORTS}
            set content = content || $1 where content->>'image_link' like $2 returning id`;
            let lbls= {image_labels: params.Labels };
            let str= '%'+params.imglink+'%';
            // Setup values
            let values = [lbls, str ];

            // Execute
            logger.debug(query, values);
            db.oneOrNone(query, values).timeout(config.PGTIMEOUT)
                .then((data) => {
                    res.json({success:true, id:data.id});
                })
                .catch((err) => {
                    logger.error(err);
                    res.json({success:false, error:err});
                    next(err);
                });
        } else {
            res.status(403).send('Forbidden');
        }

    });

    return api;
};
