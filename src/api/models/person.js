const { Utils } = require('../data');

const typeDef = `
extend type Query {
  # Retrieve all different writers
  writers(search: String, offset: Int, limit: Int): [Person]
    # Retrieve one writer
  writer(id: ID!): Person

    # Retrieve all different artists
  artists(search: String, offset: Int, limit: Int): [Person]
    # Retrieve one artists
  artist(id: ID!): Person
}

type Person {
  id: ID!
  first_name: String
  last_name: String
}`;

const resolver = {
  Query: {
    writer: Utils.genericEntityResolver('writers'),
    writers: Utils.genericEntitiesResolver('writers'),
    artist: Utils.genericEntityResolver('artists'),
    artists: Utils.genericEntitiesResolver('artists'),
  }
}

module.exports = {
  typeDef,
  resolver
}