const mongoist = require('mongoist');
const db = mongoist(process.env.MONGO_URL);

const resolvers = {
    Query: {

        comic: (root, { _id }) => db.comics.findOne({ _id }),

        comics: async (root, { search, limit = 15 }) => {

            if (search) {
                return db.comics
                    .findAsCursor(
                    { $text: { $search: search } },
                    { score: { $meta: "textScore" } })
                    .sort({ score: { $meta: "textScore" } })
                    .limit(limit)
                    .toArray();
            }

            return db.comics.aggregate([{ $sample: { size: limit } }])
        }
    },

    Mutation: {
        markComicWish: async (root, { _id, wish }, { user }) => {

            const comicExists = await db.users.findAsCursor({ _id: user, 'comics._id': _id }).count()
            let match = { _id: user };
            let update = {};

            if (comicExists) {
                match['comics._id'] = _id;
                update['$set'] = { 'comics.$.wish': wish };
            } else {
                update['$push'] = { 'comics': { _id, wish } };
            }

            await db.users.update(match, update);
            return db.comics.findOne({ _id })
        },
        markIssueRead: (root, {_id, issue, isRead }, { user }) => {
            // TODO
            console.log(_id, issue, isRead);
            return db.comics.findOne({ _id })
        },
        markIssuePage: (root, {_id, issue, page }, { user }) => {
            // TODO
            console.log(_id, issue, isRead);
            return db.comics.findOne({ _id })
        }
    },

    Issue: {
        pages: (root) => root.pages || []
    },

    Comic: {
        issues: async (root, { number = false }, { user }) => {

            const userComics = await db.users.findOne(
                { '_id': user, 'comics._id': root._id },
                { comics: { $elemMatch: { _id: root._id } } }
            );
            const userComic = userComics ? userComics.comics[0] : {};

            const issuesIds = Object.keys(userComic).filter(k => k !== '_id' && k !== 'wish')

            const userInfoIssues = root.issues.map(issue => {
                const userIssue = issuesIds.find(issueId => issueId === issue.id);
                if (userIssue) return { ...issue, ...userComic[userIssue] };
                return { ...issue, read: false, page: false }
            })

            return number ? userInfoIssues.filter(i => i.number === number) || userInfoIssues : userInfoIssues;
        },
        wish: async (root, { }, { user }) => {
            const userFound = await db.users.findOne(
                { '_id': user, 'comics._id': root._id },
                { comics: { $elemMatch: { _id: root._id } } }
            );
            return userFound ? userFound.comics[0].wish : false;
        }
    }


};

module.exports = resolvers;
