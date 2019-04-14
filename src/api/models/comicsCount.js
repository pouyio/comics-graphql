const { gql } = require('apollo-server-express');

const typeDef = gql`
type ComicsCount {
    completed: Int
    ongoing: Int
  }`;

module.exports = {
  typeDef
}