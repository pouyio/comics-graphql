const { GraphQLObjectType, GraphQLSchema} = require('graphql');
const queries = require('./queries');

const ComicQueryRootType = new GraphQLObjectType({
  name: 'ComicsAppSchema',
  description: "Comics Application Schema Query Root",
  fields: queries
});

const ComicAppSchema = new GraphQLSchema({
  query: ComicQueryRootType
});

module.exports = ComicAppSchema;
