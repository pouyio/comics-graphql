require('dotenv').load();
const express = require('express');
const graphqlHTTP = require('express-graphql');
const schema = require('./src/schema');

const app = express();

app.use('/', graphqlHTTP({
  schema,
  graphiql: true
}));

app.listen(process.env.PORT);
console.log('GraphQL API server running at port: '+ process.env.PORT);
