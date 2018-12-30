const {
  findComic,
  retrieveNew,
  comicsByUser,
  randomComics,
  retrieveComics,
  findUserComic,
  comicWishForUser } = require('../data');
const { gql } = require('apollo-server-express');

const typeDef = gql`
extend type Query {
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
}

type Comic {
    _id: ID!
    title: String
    publication_date: String @deprecated(reason: "Use 'publication' as Date.")
    publication: [CustomDate]
    status: String
    summary: String
    cover: String
    wish: Boolean
    issues (id: String, number: Int): [Issue]
    artists: [Person]
    writers: [Person]
    genres: [EntityDetail]
    publishers: [EntityDetail]
    last_update: CustomDate
  }`

const resolver = {
  Query: {
    comic: (root, { _id }) => findComic(_id),
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

      if (onlyNew) return retrieveNew();
      if (wish) return comicsByUser(user);

      if (!search && !genres.length && !writers.length && !publishers.length && !artists.length && numberOfIssues === undefined) {
        return randomComics({ limit });
      }
      return retrieveComics({ search, genres, writers, publishers, artists, numberOfIssues }, { offset, limit });

    },
  },
  Comic: {

    issues: async (root, { id, number = false }, { user }) => {

      const userComicInfo = await findUserComic(root._id, user);

      const userIssuesIds = Object.keys(userComicInfo).filter(k => k !== '_id' && k !== 'wish');

      let issuesFiltered = root.issues;

      if (id) issuesFiltered = issuesFiltered.filter(i => i.id === id) || issuesFiltered;
      if (number) issuesFiltered = issuesFiltered.filter(i => i.number === number) || issuesFiltered;

      return issuesFiltered.map(issue => {
        const userIssueId = userIssuesIds.find(issueId => issueId === issue.id);
        return { ...issue, ...userComicInfo[userIssueId], comicId: root._id, scrape: (id || number) };
      })
    },

    wish: (root, _, { user }) => comicWishForUser(user, root._id),

    publication: (root) => {
      const date = root.publication_date;
      if (!date) {
        return [];
      }
      try {
        return [...date.split(' - ').map(d => new Date(d))];
      } catch (error) {
        return [];
      }
    },

    cover: (root) => (root.cover.indexOf('/img/') === 0)
      ? `${process.env.API_URL}${root.cover}`
      : root.cover
  }
}


module.exports = {
  typeDef,
  resolver
}