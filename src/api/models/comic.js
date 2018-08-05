const data = require('../data');

const Comic = `
type Comic {
    _id: ID!
    title: String
    publication_date: String
    status: String
    summary: String
    cover: String
    wish: Boolean
    issues (id: String, number: Int): [Issue]
    artists: [Person]
    writers: [Person]
    genres: [EntityDetail]
    publishers: [EntityDetail]
    last_update: CustomDate
  }`

const ComicResolver = {
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


module.exports = {
  Comic,
  ComicResolver
}