const fs = require('fs');
const path = require('path');
const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');
const jwt = require('jsonwebtoken');
const data = require('./data');
const makeRequest = require('../source');
const extract = require('../scrapper/extract');

const _genericEntityResolver = (type) => (root, { id }) => data.retrieveEntity(type, { id });

const _genericEntitiesResolver = (type) => (root, { search = '', offset = 0, limit = 10 }) => data.retrieveEntities(type, { search, offset, limit });

const resolvers = {
    Query: {

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
    },

    Mutation: {
        markComicWish: async (root, { _id, wish }, { user }) => {

            await data.updateComicWish(_id, wish, user);
            return data.findComic(_id);

        },
        updateIssue: async (root, { _id, issue, isRead, page }, { user }) => {

            await data.updateIssueForUser(_id, issue, isRead, page, user);
            return data.findComic(_id);

        }
    },

    Date: new GraphQLScalarType({
        name: 'Date',
        description: 'Date custom scalar type',
        parseValue: (value) => new Date(value),
        serialize: (value) => new Date(value),
        parseLiteral: (ast) => (ast.kind === Kind.INT) ? parseInt(ast.value, 10) : null,
    }),

    Issue: {
        pages: async (root) => {

            if (root.pages) return root.pages;

            if (!root.scrape) return [];

            const url = `${process.env.SOURCE_URL}Comic/${root.comicId}/${root.id}?readType=1&quality=hq`;

            try {
                const { body } = await makeRequest(url);
                const pages = extract.issue(body);
                data.setPages(root.comicId, root.id, pages);
                return pages;
            } catch (e) {
                console.log(e);
                return [];
            }
        },
        read: (root) => root.read || false,
        page: (root) => root.page || 0,
        percentage: (root) => {
            const pages = (root.pages || []).length;
            const page = root.page || 0;
            return Math.floor((pages - (pages - page)) * 100 / (pages + 0.0001));
        }
    },

    Comic: {
        issues: async (root, { id, number = false }, { user }) => {

            const userComicInfo = await data.findUserComic(root._id, user);

            const userIssuesIds = Object.keys(userComicInfo).filter(k => k !== '_id' && k !== 'wish');

            let issuesFiltered = root.issues;

            if (id) issuesFiltered = issuesFiltered.filter(i => i.id === id) || issuesFiltered;
            if (number) issuesFiltered = issuesFiltered.filter(i => i.number === number) || issuesFiltered;

            return issuesFiltered.map(issue => {
                const userIssueId = userIssuesIds.find(issueId => issueId === issue.id);
                return { ...issue, ...userComicInfo[userIssueId], comicId: root._id, scrape: (id || number) };
            })
        },

        wish: (root, _, { user }) => data.comicWishForUser(user, root._id),

        cover: (root) => (root.cover.indexOf('/img/') === 0)
            ? `${process.env.API_URL}${root.cover}`
            : root.cover
    }


};

module.exports = resolvers;
