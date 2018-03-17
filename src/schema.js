const { makeExecutableSchema } = require('graphql-tools');
const resolvers = require('./resolvers');

const typeDefs = `
type Query {
  comic(_id: String!): Comic,
  comics(search: String, limit: Int, wish: Boolean): [Comic],
  genres: [EntityDetail],
  writers: [Person],
  publishers: [Person],
  artists: [Person],
  info: Info,
}

type Mutation {
  markComicWish (_id: String!, wish: Boolean!): Comic,
  updateIssue (_id: String!, issue: String!, isRead: Boolean, page: Int): Comic
}

type ComicsCount {
  completed: Int,
  ongoing: Int
}

type Info {
  genres: Int,
  writers: Int,
  publishers: Int,
  artists: Int,
  issues: Int,
  comics: ComicsCount
}

type Issue {
  id: String,
  title: String,
  release_day: String,
  number: Int,
  pages: [String],
  page: Int,
  percentage: Int,
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
  issues (id: String, number: Int): [Issue],
  artists: [Person],
  writers: [Person],
  genres: [EntityDetail],
  publishers: [EntityDetail]
}
`;

module.exports = makeExecutableSchema({ typeDefs, resolvers });