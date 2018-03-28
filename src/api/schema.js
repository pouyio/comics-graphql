const { makeExecutableSchema } = require('graphql-tools');
const resolvers = require('./resolvers');

const typeDefs = `
type Query {
  comic(_id: String!): Comic
  comics(
    offset: Int,
    limit: Int,
    wish: Boolean,
    onlyNew: Boolean,
    search: String,
    genre: String,
    writer: String,
    publisher: String,
    artist: String,
  ): [Comic]
  genres(offset: Int, limit: Int): [EntityDetail]
  writers(offset: Int, limit: Int): [Person]
  publishers(offset: Int, limit: Int): [Person]
  artists(offset: Int, limit: Int): [Person]
  info: Info
  log: String
}

type Mutation {
  markComicWish (_id: String!, wish: Boolean!): Comic,
  updateIssue (_id: String!, issue: String!, isRead: Boolean, page: Int): Comic
}

type ComicsCount {
  completed: Int
  ongoing: Int
}

scalar Date

type Info {
  last_update: Date
  genres: Int
  writers: Int
  publishers: Int
  artists: Int
  issues: Int
  comics: ComicsCount
}

type Issue {
  id: String
  title: String
  release_day: String
  number: Int
  pages: [String]
  page: Int
  percentage: Int
  read: Boolean
}

type Person {
  id: String
  first_name: String
  last_name: String
}

type EntityDetail {
  id: String
  name: String
}

type Comic {
  _id: String!
  title: String
  publication_date: String
  status: String
  summary: String
  cover: String
  wish: Boolean
  issues (id: String, number: Int): [Issue]
  artists: [Person]
  writers: [Person]
  genres: [EntityDetail]
  publishers: [EntityDetail]
  last_update: Date
}
`;

module.exports = makeExecutableSchema({ typeDefs, resolvers });