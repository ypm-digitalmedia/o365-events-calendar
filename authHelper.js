// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See full license at the bottom of this file.
var credentials = {
    client: {
        id: 'd8a3a21d-9fa3-4c1d-ba49-140c7586ce86',
        secret: '3FNke5BjAz3ox1wpug5j9NS',
    },
    auth: {
        tokenHost: 'https://login.microsoftonline.com',
        authorizePath: 'common/oauth2/v2.0/authorize',
        tokenPath: 'common/oauth2/v2.0/token'
    }
};
var oauth2 = require('simple-oauth2').create(credentials);

var redirectUri = 'http://localhost:8000/authorize';

// The scopes the app requires
var scopes = ['openid',
    'offline_access',
    'https://outlook.office.com/mail.read',
    'https://outlook.office.com/calendars.read',
    'https://outlook.office.com/calendars.read.shared',
    'https://outlook.office.com/contacts.read'
];

function getAuthUrl() {
    var returnVal = oauth2.authorizationCode.authorizeURL({
        redirect_uri: redirectUri,
        scope: scopes.join(' ')
    });
    console.log('Generated auth url: ' + returnVal);
    return returnVal;
}

function getTokenFromCode(auth_code, callback, response) {
    var token;
    oauth2.authorizationCode.getToken({
        code: auth_code,
        redirect_uri: redirectUri,
        scope: scopes.join(' ')
    }, function(error, result) {
        if (error) {
            console.log('Access token error: ', error.message);
            callback(response, error, null);
        } else {
            token = oauth2.accessToken.create(result);
            console.log('Token created: ', token.token);
            callback(response, null, token);
        }
    });
}

function refreshAccessToken(refreshToken, callback) {
    var tokenObj = oauth2.accessToken.create({ refresh_token: refreshToken });
    tokenObj.refresh(callback);
}

exports.getAuthUrl = getAuthUrl;
exports.getTokenFromCode = getTokenFromCode;
exports.refreshAccessToken = refreshAccessToken;

/*
  MIT License: 

  Permission is hereby granted, free of charge, to any person obtaining 
  a copy of this software and associated documentation files (the 
  ""Software""), to deal in the Software without restriction, including 
  without limitation the rights to use, copy, modify, merge, publish, 
  distribute, sublicense, and/or sell copies of the Software, and to 
  permit persons to whom the Software is furnished to do so, subject to 
  the following conditions: 

  The above copyright notice and this permission notice shall be 
  included in all copies or substantial portions of the Software. 

  THE SOFTWARE IS PROVIDED ""AS IS"", WITHOUT WARRANTY OF ANY KIND, 
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF 
  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND 
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE 
  LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION 
  OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION 
  WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/