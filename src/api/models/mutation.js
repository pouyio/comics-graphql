const {
    updateComicWish,
    findComic,
    updateIssueForUser
} = require('../data');
const { gql } = require('apollo-server-express');

const typeDef = gql`
type Mutation {
    markComicWish (_id: ID!, wish: Boolean!): Comic,
    updateIssue (_id: ID!, issue: String!, isRead: Boolean, page: Int): Comic
}`;

const resolver = {
    Mutation: {

        markComicWish: async (root, { _id, wish }, { user }) => {

            await updateComicWish(_id, wish, user);
            return findComic(_id);

        },
        updateIssue: async (root, { _id, issue, isRead, page }, { user }) => {

            await updateIssueForUser(_id, issue, isRead, page, user);
            return findComic(_id);

        }
    }
};

module.exports = {
    typeDef,
    resolver
}