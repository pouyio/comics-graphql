const {
  makeExecutableSchema,
  addMockFunctionsToSchema
} = require('graphql-tools');
const resolvers = require('./resolvers');

const typeDefs = `
type Query {
  comic(_id: String!): Comic
  comics(search: String, limit: Int, byUser: Boolean): [Comic],
}

type Issue {
  id: String,
  title: String,
  release_day: String,
  number: Int,
  pages: [String],
  page: Int,
  read: Boolean
}

type Person {
  id: String,
  first_name: String,
  last_name: String
}

type EntityDetail {
  id: String,
  name: String
}

type Comic {
  _id: String!,
  title: String,
  publication_date: String,
  status: String,
  summary: String,
  cover: String,
  wish: Boolean,
  issues (number: Int): [Issue],
  artists: [Person],
  writers: [Person],
  genres: [EntityDetail],
  publishers: [EntityDetail]
}
`;

module.exports = makeExecutableSchema({ typeDefs, resolvers });