const data = require('./data');

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
        pages: (root) => root.pages || [],
        read: (root) => root.read || false,
        page: (root) => root.page || 0,
        percentage: (root) => (Math.floor((root.pages || []).length - (root.page || 0) / (root.pages || []).length) || 0)
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
                return { ...issue, ...userComicInfo[userIssueId] };
            })
        },

        wish: (root, { }, { user }) => data.comicWishForUser(user, root._id)
    }


};

module.exports = resolvers;
