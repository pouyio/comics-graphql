const { makeExecutableSchema } = require('graphql-tools');
const resolvers = require('./resolvers');

const typeDefs = `
type Query {
    # Retrieve one comic by ID
  comic(_id: ID!): Comic

    # Find comics based on different parameters
  comics(
      # Pagination offset
    offset: Int,
      # Pagination limit
    limit: Int,
      # Retrieve comics wished by the user
    wish: Boolean,
      # Retrieve last comics updated
    onlyNew: Boolean,
      # Text to lookup on title and summary
    search: String,
      # Filter comics containing all of these genres
    genres: [String!],
      # Filter comics containing all of these writers
    writers: [String!],
      # Filter comics containing all of these publishers
    publishers: [String!],
      # Filter comics containing all of these artists
    artists: [String!],
      # Minimun number of issues starting in 1
    numberOfIssues: Int
  ): [Comic]

    # Retrieve all different genres
  genres(search: String, offset: Int, limit: Int): [EntityDetail]
    # Retrieve one genre
  genre(id: ID!): EntityDetail

    # Retrieve all different writers
  writers(search: String, offset: Int, limit: Int): [Person]
    # Retrieve one writer
  writer(id: ID!): Person

    # Retrieve all different publishers
  publishers(search: String, offset: Int, limit: Int): [EntityDetail]
    # Retrieve one publisher
  publisher(id: ID!): EntityDetail

    # Retrieve all different artists
  artists(search: String, offset: Int, limit: Int): [Person]
    # Retrieve one artists
  artist(id: ID!): Person

    # Global info and numbers
  info: Info

    # Plain log text from the scrapper
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
  id: ID!
  first_name: String
  last_name: String
}

type EntityDetail {
  id: ID!
  name: String
}

type Comic {
  _id: ID!
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