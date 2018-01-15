const mongoist = require('mongoist');
const db = mongoist(process.env.MONGO_URL);
const ComicType = require('./comic.model');

const {
  GraphQLString,
  GraphQLList,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLEnumType
} = require('graphql');


module.exports = {
  comics: {
    type: new GraphQLList(ComicType),
    description: 'List of comics details, 10 by default',
    args: {
      read: { type: GraphQLBoolean },
      user: { type: GraphQLString },
      limit: { type: GraphQLInt, description: 'Maximun number of comics' }
    },
    resolve: async (root, { read, user, limit = 10 }) => {
      let dbResponse = [];

      if (read) {
        const aggregation = [
          { $match: { _id: user } },
          { $project: { _id: 0, comics: 1, attributes: 1 } },
          { $unwind: '$comics' },
          { $replaceRoot: { newRoot: '$comics' } }
        ];
        dbResponse = await db.users.aggregate(aggregation);
      } else {
        dbResponse = await db.comics
          .findAsCursor()
          .limit(limit)
          .toArray()
      }

      return dbResponse.map(c => ({ ...c, id: c._id }));
    }
  },
  comic: {
    type: ComicType,
    description: "Comic detail",
    args: {
      id: {
        type: GraphQLString
      },
      read: {
        type: GraphQLBoolean,
        resolve: console.log
      }
    },
    resolve: async (root, { id, user }) => {
      const dbResponse = await db.comics.findOne({ _id: id });
      return {...dbResponse, id: dbResponse._id}
    }
  }
}
