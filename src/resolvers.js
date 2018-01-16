const mongoist = require('mongoist');
const db = mongoist(process.env.MONGO_URL);

const resolvers = {
    Query: {
        // user: async (root, { _id }) => {
        //     const res = await db.users.findOne({ _id });
        //     const comics = res.comics.map(c => {
        //         const issues = Object.keys(c)
        //             .filter(k => k !== '_id' && k !== 'wish')
        //             .map(k => ({ id: k }));
        //         return { _id: c._id, wish: c.wish, issues };
        //     });

        //     return { ...res, comics };

        // },

        comic: (root, { _id }, { user }) => db.comics.findOne({ _id }),

        comics: async (root, { search, byUser, limit = 15 }, { user }) => {

            if (search) {
                return db.comics
                    .findAsCursor(
                    { $text: { $search: search } },
                    { score: { $meta: "textScore" } })
                    .sort({ score: { $meta: "textScore" } }).limit(limit).toArray();
            }

            if (byUser) {
                return (await db.users.findOne({ _id: user })).comics.map(async c => {

                    const issuesIds = Object.keys(c).filter(k => k !== '_id' && k !== 'wish')

                    const comic = await db.comics.findOne({ _id: c._id });
                    const userInfoIssues = comic.issues.map(issue => {
                        const userIssue = issuesIds.find(issueId => issueId === issue.id);
                        if(userIssue) return { ...issue, ...c[userIssue] };
                        return {...issue, read: false, page: false}
                    })
                    return { ...comic, wish: c.wish, issues: userInfoIssues };

                });
            }

            return db.comics
                .findAsCursor()
                .limit(limit)
                .toArray()
        }
    },

    Issue: { pages: (root) => root.pages || [] },

    Comic: {
        issues: (root, { number = false }) => number ? root.issues.filter(i => i.number === number) || root.issues : root.issues
    }


};

module.exports = resolvers;
