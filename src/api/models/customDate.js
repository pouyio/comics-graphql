const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');

const typeDef = `
scalar CustomDate
`;

const resolver = {
  CustomDate: new GraphQLScalarType({
    name: 'CustomDate',
    description: 'CustomDate custom scalar type',
    parseValue: (value) => new Date(value),
    serialize: (value) => new Date(value),
    parseLiteral: (ast) => (ast.kind === Kind.INT) ? parseInt(ast.value, 10) : null,
  })
}

module.exports = {
  typeDef,
  resolver
}