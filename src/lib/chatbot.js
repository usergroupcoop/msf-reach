import config from '../config';
var Promise = require('bluebird');
const AWS = require('aws-sdk');
const lambda = new AWS.Lambda({apiVersion: '2015-03-31', region: 'us-east-1'});

module.exports.addChatbotItem = (data,id,body,reportUrl,logger) => new Promise((resolve, reject) =>
{
    if (typeof(body.metadata)!=='undefined' && 'name' in body.metadata && typeof(body.metadata.name) === 'string') {
        let keywords = body.metadata.name.split(/[_ ]/);
        let eventName = keywords.join(' ');
        if (typeof(body.metadata.event_datetime) != 'undefined' && body.metadata.event_datetime) {
            keywords.push(body.metadata.event_datetime);
        }

        if (config.BOT_HANDLER_ARN) {

            // set up the lambda event to pass on the bot handler lambda:
            var event = {
                'Command': 'ADD',
                'Body': [
                    {
                        'qid': id,
                        'q': keywords,
                        'a':'Please submit a report for the event ' + eventName + ' [report link]('+reportUrl+')',
                        'r':
                {'title':'','imageUrl':''}
                    }
                ]
            };
            // set up the add parameters
            var addParams = {
                FunctionName: config.BOT_HANDLER_ARN, /* required */
                ClientContext: 'msf-reach-server',
                InvocationType: 'Event',
                Payload: JSON.stringify(event) /* Strings will be Base-64 encoded on your behalf */,
            };
            // also set up parameters for a chatbot knowledgebase (re)build
            var buildParams = {
                FunctionName: config.BOT_HANDLER_ARN, /* required */
                ClientContext: 'msf-reach-server',
                InvocationType: 'Event',
                Payload: JSON.stringify({'Command':'BUILD'})
            };

            // invoke the bot lambda to add an event to its knowledgebase
            logger.info('invoking chatbot handler lambda');
            lambda.invoke(addParams, function(err, data) { // eslint-disable-line no-unused-vars
                if (err) {
                    reject(err);
                }
                else lambda.invoke(buildParams, function(err, data) { // eslint-disable-line no-unused-vars
                    if (err) {
                        reject(err);
                    }
                });
            });
            //  .then(lambda.invoke(buildParams).promise().catch(function (err) {
            //    console.log(err)})).catch(function(err){console.log(err)})
        }
    }
    resolve(data);

});
