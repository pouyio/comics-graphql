const { Utils } = require('../data');
const { gql } = require('apollo-server');

const typeDef = gql`
extend type Query {
  # Retrieve all different genres
  genres(search: String, offset: Int, limit: Int): [EntityDetail]
    # Retrieve one genre
  genre(id: ID!): EntityDetail
  # Retrieve all different publishers
  publishers(search: String, offset: Int, limit: Int): [EntityDetail]
    # Retrieve one publisher
  publisher(id: ID!): EntityDetail
}

type EntityDetail {
  id: ID!
  name: String
}`;

const resolver = {
  Query: {
    genre: Utils.genericEntityResolver('genres'),
    genres: Utils.genericEntitiesResolver('genres'),
    publisher: Utils.genericEntityResolver('publishers'),
    publishers: Utils.genericEntitiesResolver('publishers'),
  }
}

module.exports = {
  typeDef,
  resolver
}