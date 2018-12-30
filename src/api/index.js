const express = require('express');
const compression = require('compression');
const { ApolloServer } = require('apollo-server-express');
const cors = require('./cors');
const { typeDefs, resolvers } = require('./schema');
const { check_token, login } = require('./auth');
const { img_proxy_limiter, img_proxy_cache, img_proxy, img_download } = require('./img');

const api = express();

api.use(compression());
api.use(cors);

api.post('/login', login);

api.get('/img/*', img_proxy_cache, img_proxy_limiter, img_proxy);

api.get('/proxy-img/*', img_download);

api.use(check_token);

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => ({ user: req.user })
});
server.applyMiddleware({ app: api, path: '/graphql' });

module.exports = { api };