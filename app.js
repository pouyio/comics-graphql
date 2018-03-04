require('dotenv').load();
const fs = require('fs');
const https = require('https');
const express = require('express');
const cors = require('./src/cors');
const bodyParser = require('body-parser');
const schema = require('./src/schema');
const { graphqlExpress } = require('apollo-server-express');
const { check_token, login } = require('./src/auth');
const { makeRequest } = require('./src/source');

const app = express();

app.use(cors);

app.use(bodyParser.json());

app.post('/login', login);

app.get('/img/*', async (req, res) => {
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

app.use(check_token);

app.use('/graphql', graphqlExpress((req) => ({ schema, context: { user: req.user } })));

if (process.env.NODE_ENV === 'production') {
    const options = {
        key: fs.readFileSync('/etc/letsencrypt/live/aws/privkey.pem'),
        cert: fs.readFileSync('/etc/letsencrypt/live/aws/fullchain.pem')
    }
    https
        .createServer(options || {}, app)
        .listen(process.env.PORT, () => console.log('Comics-api listenin on port ' + process.env.PORT));
} else {

    require('http')
        .createServer(app)
        .listen(process.env.PORT, () => console.log('Comics-api listenin on port ' + process.env.PORT));
}