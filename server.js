'use strict'; // eslint-disable-line strict
// server.js
// where your node app starts

// init project
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const Helper = require('./helpers.js');
const Globalize = require('./globalize.js');
const LoadConfig = require('./config.js');
const config = new LoadConfig();
const ResponseException = require('./exceptions.js').ResponseException;

const handleError = (error, request, response, next) => { // eslint-disable-line no-unused-vars

    console.log('request failed');
    console.log('route: ', request.route ? request.route.path : '');
    console.log('query: ', request.query);
    console.log('error: ', error);
    console.log('body: ', request.body);

    let publicError = error;

    if (error instanceof Error) {
        // native js-errors are not stringifyable
        publicError = error.message;
    }

    response
        .status(error.status || 500)
        .send(JSON.stringify(publicError, null, 2));
};

const exec = (action) => {
    return (request, response, next) => {
        action(request, response, next)
        .then(() => {
            if (!response.headersSent) {
                response.send('OK');
            }
        })
        .catch((error) => handleError(error, request, response, next));
    };
};

const authenticate = function(request, response, next) {

    if (request === null || request.query === request) {
        console.log('401 - Unauthorized request');
        throw new ResponseException('401 - Unauthorized request', 403);
    }

    if (!request.body) {
        console.log('401 - Missing request body');
        throw new ResponseException('401 - Missing request body', 401);
    }

    let requestToken = request.body.token;

    if (!requestToken) {
        console.log('401 - Missing request body');
        throw new ResponseException('401 - Missing access token', 401);
    }

    if (requestToken !== config.globalConf.authToken) {
        console.log(`wrong secret token = ${requestToken}`);
        throw new ResponseException('403 - Forbidden', 403);
    }

    console.log('Authentication succeeded');
    next();
};

const selectKodiInstance = function(request, response, next) {
    config.routeKodiInstance(request);
    next();
};

const allRoutesExceptRoot = /\/.+/;

app.use(bodyParser.json());
app.use(express.static(`${__dirname}/views`));

app.use('/listRoutes', Helper.listRoutes);

app.use(allRoutesExceptRoot, authenticate);
app.use(allRoutesExceptRoot, selectKodiInstance);

// Pause or Resume video player
app.all('/do', exec(Globalize.kodiDo));

// error handlers need to be last
app.use(handleError);

// listen for requests :)
const listener = app.listen(config.globalConf.listenerPort, () => {
    console.log(`Your app is listening on port ${listener.address().port}`);
});
