const data = require('../data');

const Mutation = `
type Mutation {
    markComicWish (_id: ID!, wish: Boolean!): Comic,
    updateIssue (_id: ID!, issue: String!, isRead: Boolean, page: Int): Comic
}`;

const MutationResolver = {
    markComicWish: async (root, { _id, wish }, { user }) => {

        await data.updateComicWish(_id, wish, user);
        return data.findComic(_id);

    },
    updateIssue: async (root, { _id, issue, isRead, page }, { user }) => {

        await data.updateIssueForUser(_id, issue, isRead, page, user);
        return data.findComic(_id);

    }
};

module.exports = {
    Mutation,
    MutationResolver
}