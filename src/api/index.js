const express = require('express');
const compression = require('compression');
const bodyParser = require('body-parser');
const { ApolloServer, AuthenticationError } = require('apollo-server-express');
const cors = require('./cors');
const { typeDefs, resolvers } = require('./schema');
const { get_user_logged, login } = require('./auth');
const { img_proxy_limiter, img_proxy_cache, img_proxy, img_download } = require('./img');

const api = express();

api.use(compression());
api.use(cors);
api.use(bodyParser.json());

api.post('/login', login);

api.get('/img/*', img_proxy_cache, img_proxy_limiter, img_proxy);

api.get('/proxy-img/*', img_download);

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req, res }) => {
        const user = await get_user_logged(req, res);
        return { user };
    },
    playground: { endpoint: `http://localhost:4000/graphql` }
});
server.applyMiddleware({ app: api, path: '/graphql' });

module.exports = { api };