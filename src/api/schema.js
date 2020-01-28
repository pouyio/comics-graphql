const { merge } = require('lodash');
const { typeDef: Mutation, resolver: MutationResolver } = require('./models/mutation');
const { typeDef: Comic, resolver: ComicResolver } = require('./models/comic');
const { typeDef: Person, resolver: PersonResolver } = require('./models/person');
const { typeDef: EntityDetail, resolver: EntityDetailResolver } = require('./models/entityDetail');
const { typeDef: Issue, resolver: IssueResolver } = require('./models/issue');
const { typeDef: CustomDate, resolver: CustomDateResolver } = require('./models/customDate');
const { typeDef: Info, resolver: InfoResolver } = require('./models/info');
const { typeDef: ComicsCount } = require('./models/comicsCount');

module.exports = {
  typeDefs: [
    Mutation,
    Comic,
    EntityDetail,
    Issue,
    CustomDate,
    ComicsCount,
    Person,
    Info
  ],
  resolvers:
    merge(
      MutationResolver,
      ComicResolver,
      InfoResolver,
      CustomDateResolver,
      IssueResolver,
      EntityDetailResolver,
      PersonResolver)
};