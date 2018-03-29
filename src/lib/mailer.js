const nodemailer = require('nodemailer');

var config=require('./config.js');

//console.log(config.SMTP.user);
//console.log(config.SMTP.pass);

// create reusable transporter object using the default SMTP transport
let smtpConfig = {
    host: 'email-smtp.us-west-2.amazonaws.com',
    port: 465,
    secure: true,
    requireTLS: true,
    auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS
    }
};

var transport = nodemailer.createTransport(smtpConfig);

/**
    * send an email
    * @function mail
    * @param {string} receiver - receiver(s) of the email2
    * @param {string} emContext - email context
    * @param {Object} logger - logging object for logging any errors
    */
module.exports.mail = (receiver,emContext,logger) => new Promise((resolve, reject) =>
{

    let mailOptions = {
        from: 'MSF-REACH <admin@msf-reach.org>', // sender address
        subject: 'Update your MSF-REACH contact details',
        template: 'fixme',
        context: emContext
    };

    // send mail with defined transport object
    logger.info('Sending email to '+receivers);
    transport.sendMail(mailOptions, (error, info) => {
        if (error) {
            logger.error(error);
            reject(error);
        }
        else
            logger.info('Email %s sent: %s', info.messageId, info.response);
        resolve(); // fixme probably want to resolve something useful
    });

});
