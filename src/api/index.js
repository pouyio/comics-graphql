const express = require('express');
const bodyParser = require('body-parser');
const { graphqlExpress } = require('apollo-server-express');
const cors = require('./cors');
const schema = require('./schema');
const { check_token, login } = require('./auth');
const { makeRequest } = require('./source');

const api = express();

api.use(cors);

api.use(bodyParser.json());

api.post('/login', login);

api.get('/img/*', async (req, res) => {
    const url = `${process.env.SOURCE_URL}${req.params['0']}`;
    try {
        const { body, type } = await makeRequest(url);
        res.header('Content-Type', type);
        res.send(body);
    } catch (err) {
        console.log(err);
        res.end();
    }
})

api.use(check_token);

api.use('/graphql', graphqlExpress((req) => ({ schema, context: { user: req.user } })));

module.exports = { api };