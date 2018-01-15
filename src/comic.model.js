const {
    GraphQLString,
    GraphQLList,
    GraphQLObjectType,
    GraphQLNonNull,
    GraphQLBoolean,
    GraphQLInt,
    GraphQLEnumType
  } = require('graphql');

const StatusEnum = new GraphQLEnumType({
    name: 'Status',
    values: {
        Completed: { value: 'Completed' },
        Ongoing: { value: 'Ongoing' }
    }
});

const TypeEnum = new GraphQLEnumType({
    name: 'Type',
    values: {
        artists: { value: 'artists' },
        genres: { value: 'genres' },
        issues: { value: 'issues' },
        publishers: { value: 'publishers' },
        writers: { value: 'writers' }
    }
});

const AttributesType = new GraphQLObjectType({
    name: 'Attributes',
    fields: {
        'title': { type: GraphQLString },
        'publication_date': { type: GraphQLString },
        'status': { type: StatusEnum },
        'summary': { type: GraphQLString }
    }
});

const ElementsAttributesType = new GraphQLObjectType({
    name: 'ElementsAttributes',
    fields: {
        'title': { type: GraphQLString },
        'release_day': { type: GraphQLString },
        'number': { type: GraphQLInt }
    }
});


const IncludedType = new GraphQLObjectType({
    name: 'Included',
    fields: {
        'id': { type: GraphQLString },
        'type': { type: TypeEnum },
        'attributes': { type: ElementsAttributesType },
        'pages': {
            type: new GraphQLList(GraphQLString),
            resolve: (obj) => obj.pages || []
        }
    }
});

const ComicType = new GraphQLObjectType({
    name: 'Comic',
    description: 'This represent an comic',
    fields: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        cover: { type: GraphQLString },
        read: { type: GraphQLBoolean },
        attributes: { type: AttributesType },
        included: { type: new GraphQLList(IncludedType) }
    }
});

module.exports = ComicType;