const data = require('./data');
const sourceServer = require('./source');

const resolvers = {
    Query: {

        comic: (root, { _id }) => data.findComic(_id),

        comics: async (root, { search, wish, limit = 10 }, { user }) => {

            if (wish) return data.comicsByUser(user);

            return search
                ? data.searchComics(search, limit)
                : data.randomComics(limit);

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

    Issue: {
        pages: async (root) => {

            if (root.pages) return root.pages;

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
            if (number) issuesFiltered = issuesFiltered.filter(i => i.number === id) || issuesFiltered;

            return issuesFiltered.map(issue => {
                const userIssueId = userIssuesIds.find(issueId => issueId === issue.id);
                return { ...issue, ...userComicInfo[userIssueId], comicId: root._id };
            })
        },

        wish: (root, { }, { user }) => data.comicWishForUser(user, root._id),

        cover: (root) => (root.cover.indexOf('/img/') === 0)
            ? `${process.env.API_URL}${root.cover}`
            : root.cover
    }


};

module.exports = resolvers;
