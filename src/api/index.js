const express = require('express');
const compression = require('compression');
const bodyParser = require('body-parser');
const { ApolloServer } = require('apollo-server-express');
const { typeDefs, resolvers } = require('./schema');
const { get_user_logged, login } = require('./auth');
const { img_proxy_limiter, img_proxy_cache, img_proxy, img_download } = require('./img');

const BASE_URL_DEPLOY = '/.netlify/functions/index';

const app = express();
const router = express.Router();

app.use(compression());
app.use(bodyParser.json());

router.get('/ok', (req, res) => res.send('ok!'));

router.post('/login', login);

router.get('/img/*', img_proxy_cache, img_proxy_limiter, img_proxy);

// router.get('/proxy-img/*', img_download);

const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    context: async ({ req, res }) => {
        const user = await get_user_logged(req, res);
        return { user };
    }
});
server.applyMiddleware({ app, path: BASE_URL_DEPLOY + '/graphql' });

app.use(BASE_URL_DEPLOY, router);

module.exports = { app };