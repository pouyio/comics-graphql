const data = require('./data');
const sourceServer = require('./source');
const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');

const resolvers = {
    Query: {

        comic: (root, { _id }) => data.findComic(_id),

        comics: (root, { search, wish, limit = 10, onlyNew = false }, { user }) => {

            if (onlyNew) return data.retrieveNew();
            if (wish) return data.comicsByUser(user);

            return search
                ? data.searchComics(search, limit)
                : data.randomComics(limit);

        },

        info: (root) => data.retrieveInfo(),

        genres: (root) => data.retrieveEntitiDetails('genres'),

        writers: (root) => data.retrievePersons('writers'),

        publishers: (root) => data.retrievePersons('publishers'),

        artists: (root) => data.retrievePersons('artists')
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
        genres: async () => (await data.retrieveEntitiDetails('genres')).length,
        writers: async () => (await data.retrievePersons('writers')).length,
        publishers: async () => (await data.retrievePersons('publishers')).length,
        artists: async () => (await data.retrievePersons('artists')).length,
        comics: async () => ({
            completed: data.retrieveComicsByStatus('Completed'),
            ongoing: data.retrieveComicsByStatus('Ongoing')
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

        wish: (root, { }, { user }) => data.comicWishForUser(user, root._id),

        cover: (root) => (root.cover.indexOf('/img/') === 0)
            ? `${process.env.API_URL}${root.cover}`
            : root.cover
    }


};

module.exports = resolvers;
