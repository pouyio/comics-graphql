const fs = require('fs');
const path = require('path');

const data = require('../data');

const _genericEntityResolver = (type) => (root, { id }) => data.retrieveEntity(type, { id });

const _genericEntitiesResolver = (type) => (root, { search = '', offset = 0, limit = 10 }) => data.retrieveEntities(type, { search, offset, limit });

const Query = `
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
}`;

const QueryResolver = {

    comic: (root, { _id }) => data.findComic(_id),

    comics: (root, {
        wish,
        search,
        numberOfIssues,
        genres = [],
        writers = [],
        publishers = [],
        artists = [],
        offset = 0,
        limit = 10,
        onlyNew = false }, { user }) => {

        if (onlyNew) return data.retrieveNew();
        if (wish) return data.comicsByUser(user);

        if (!search && !genres.length && !writers.length && !publishers.length && !artists.length && numberOfIssues === undefined) {
            return data.randomComics({ limit });
        }
        return data.retrieveComics({ search, genres, writers, publishers, artists, numberOfIssues }, { offset, limit });

    },

    info: (root) => data.retrieveInfo(),

    genres: _genericEntitiesResolver('genres'),
    writers: _genericEntitiesResolver('writers'),
    publishers: _genericEntitiesResolver('publishers'),
    artists: _genericEntitiesResolver('artists'),

    genre: _genericEntityResolver('genres'),
    writer: _genericEntityResolver('writers'),
    publisher: _genericEntityResolver('publishers'),
    artist: _genericEntityResolver('artists'),


    log: (root) => {
        const filePath = path.join(process.cwd() + process.env.LOG_PATH);
        return fs.existsSync(filePath) ? fs.readFileSync(filePath) : '';
    }
};


module.exports = {
    Query,
    QueryResolver
}