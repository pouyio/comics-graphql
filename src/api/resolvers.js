const fs = require('fs');
const path = require('path');
const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');
const jwt = require('jsonwebtoken');
const data = require('./data');
const sourceServer = require('./source');

const _genericEntityResolver = (type) => (root, { offset = 0, limit = 10 }) => data.retrieveEntities(type, { offset, limit });

const _genericEntityCountResolver = (type) => async () => (await data.retrieveEntities(type, { offset: 0, limit: Infinity })).length;

const resolvers = {
    Query: {

        comic: (root, { _id }) => data.findComic(_id),

        comics: (root, {
            wish,
            search,
            genre,
            writer,
            publisher,
            artist,
            offset = 0,
            limit = 10,
            onlyNew = false }, { user }) => {

            if (onlyNew) return data.retrieveNew();
            if (wish) return data.comicsByUser(user);

            if (!search && !genre && !writer && !publisher && !artist) {
                return data.randomComics({ limit });
            }
            return data.retrieveComics({ search, genre, writer, publisher, artist }, { offset, limit });

        },

        info: (root) => ({}),

        genres: _genericEntityResolver('genres'),
        writers: _genericEntityResolver('writers'),
        publishers: _genericEntityResolver('publishers'),
        artists: _genericEntityResolver('artists'),

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

    Info: {
        last_update: async () => (await data.retrieveLastUpdateDate()).last_update,
        issues: async () => (await data.retrieveIssues())[0].count,
        genres: _genericEntityCountResolver('genres'),
        writers: _genericEntityCountResolver('writers'),
        publishers: _genericEntityCountResolver('publishers'),
        artists: _genericEntityCountResolver('artists'),
        comics: () => ({
            completed: data.retrieveTotalComicsByStatus('Completed'),
            ongoing: data.retrieveTotalComicsByStatus('Ongoing')
        })
    },

    Issue: {
        pages: async (root) => {

            if (root.pages) return root.pages;

            if (!root.scrape) return [];

            const url = `${process.env.SOURCE_URL}Comic/${root.comicId}/${root.id}?readType=1&quality=hq`;

            try {
                const { body } = await sourceServer.makeRequest(url);
                const pages = await sourceServer.issue(body);
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
