const mongoist = require('mongoist');
const db = mongoist(process.env.MONGO_URL);

const _ensureIssueExists = async (comic, issue, user) => {
    const hasComic = await db.users.findAsCursor({ _id: user, 'comics._id': comic }).count();

    if (!hasComic) {
        return await db.users.update({ _id: user },
            { $push: { comics: { _id: comic, wish: false, [issue]: { page: 0, read: false } } } });
    }

    const aggregation = [];
    aggregation.push({ $match: { _id: user } });
    aggregation.push({ $unwind: '$comics' });
    aggregation.push({ $match: { 'comics._id': comic } });
    aggregation.push({ $replaceRoot: { newRoot: "$comics" } });
    aggregation.push({ $match: { [issue]: { $exists: true } } });

    const hasIssue = await db.users.aggregate(aggregation);

    if (!hasIssue.length) {
        return await db.users.update({ _id: user, 'comics._id': comic }, { $set: { [`comics.$.${issue}`]: { page: 0, read: false } } });
    }
    return;
}

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
        updateIssue: async (root, { _id, issue, isRead, page }, { user }) => {
            const $set = {};
            if (isRead !== undefined) $set[`comics.$.${issue}.read`] = isRead;
            if (page !== undefined) $set[`comics.$.${issue}.page`] = page;
            await _ensureIssueExists(_id, issue, user);
            await db.users.update(
                { _id: user, 'comics._id': _id },
                { $set });
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
