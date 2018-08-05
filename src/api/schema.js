const { makeExecutableSchema } = require('graphql-tools');
const { Query, QueryResolver } = require('./models/query');
const { Mutation, MutationResolver } = require('./models/mutation');
const { Comic, ComicResolver } = require('./models/comic');
const { Person } = require('./models/person');
const { EntityDetail } = require('./models/entityDetail');
const { Issue, IssueResolver } = require('./models/issue');
const { CustomDate, CustomDateResolver } = require('./models/customDate');
const { Info } = require('./models/info');
const { ComicsCount } = require('./models/comicsCount');


module.exports = makeExecutableSchema({
  typeDefs: [ CustomDate, Query, Mutation, Comic, Person, EntityDetail, Issue, Info, ComicsCount],
  resolvers: {
    CustomDate: CustomDateResolver,
    Query: QueryResolver,
    Mutation: MutationResolver,
    Issue: IssueResolver,
    Comic: ComicResolver
  }
});