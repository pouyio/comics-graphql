const data = require('../data');
const makeRequest = require('../../source');
const extract = require('../../scrapper/extract');

const Issue = `
type Issue {
    id: String
    title: String
    release_day: String
    number: Int
    pages: [String]
    page: Int
    percentage: Int
    read: Boolean
  }`;

const IssueResolver = {
  pages: async (root) => {

    if (root.pages) return root.pages;

    if (!root.scrape) return [];

    const url = `${process.env.SOURCE_URL}Comic/${root.comicId}/${root.id}?readType=1&quality=hq`;

    try {
      const { body } = await makeRequest(url);
      const pages = extract.issue(body);
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
};

module.exports = {
  Issue,
  IssueResolver
}