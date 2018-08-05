const { retrieveInfo } = require('../data');

const typeDef = `
extend type Query {
  # Global info and numbers
  info: Info
}

type Info {
    last_update: CustomDate
    genres: Int
    writers: Int
    publishers: Int
    artists: Int
    issues: Int
    comics: ComicsCount
  }`;

const resolver = {
  Query: {
    info: (root) => retrieveInfo(),
  }
}

module.exports = {
  typeDef,
  resolver
}