const express = require('express');
const bodyParser = require('body-parser');
const { graphqlExpress } = require('apollo-server-express');
const cors = require('./cors');
const schema = require('./schema');
const { check_token, login } = require('./auth');
const compression = require('compression');
const { img_proxy, img_download } = require('./img');

const api = express();

api.use(compression());
api.use(cors);

api.use(bodyParser.json());

api.post('/login', login);

api.get('/img/*', img_proxy);

api.get('/proxy-img/*', img_download);

api.use(check_token);

api.use('/graphql', graphqlExpress((req) => ({ schema, context: { user: req.user } })));

module.exports = { api };