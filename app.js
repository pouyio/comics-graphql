require('dotenv').load();
const express = require('express');
const bodyParser = require('body-parser');
const schema = require('./src/schema');
const { graphqlExpress } = require('apollo-server-express');
const { check_token, login } = require('./src/auth');

const app = express();

app.use(bodyParser.json());

app.post('/login', login);

app.use(check_token);

app.use('/graphql', graphqlExpress((req) => ({ schema, context: { user: req.user } })));

app.listen(process.env.PORT, () => console.log(`GraphiQL is running on port ${process.env.PORT}`));