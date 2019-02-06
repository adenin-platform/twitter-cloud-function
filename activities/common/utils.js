'use strict';

const got = require('got');
const logger = require('@adenin/cf-logger');

module.exports = {
    handleError(error, activity) {
        logger.error(error);

        let m = error.message;

        if (error.stack) {
            m = m + ': ' + error.stack;
        }

        activity.Response.ErrorCode = (error.response && error.response.statusCode) || 500;

        activity.Response.Data = {
            ErrorText: m
        };
    },
    async accessToken(activity) {
        const credentials = Buffer.from(
            rfcEncode(activity.Context.connector.clientId) +
            ':' +
            rfcEncode(activity.Context.connector.custom1)
        ).toString('base64');

        const opts = {
            method: 'POST',
            headers: {
                Authorization: 'Basic ' + credentials,
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
            },
            body: 'grant_type=client_credentials'
        };

        const response = await got('https://api.twitter.com/oauth2/token', opts);
        const json = JSON.parse(response.body);

        if (json.token_type === 'bearer') {
            return json.access_token;
        }

        return null;
    }
};

function rfcEncode(key) {
    return encodeURIComponent(key)
        .replace(/!/g, '%21')
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/\*/g, '%2A');
}
