const cheerio = require('cheerio');
const mongoist = require('mongoist');
const db = mongoist(process.env.MONGO_URL);
const py_request = require('./source');
const extract = require('./extract');
const logger = require('./logger');
let lastPage = 2;


const insertComic = async (newComic) => {
  logger.info('Insert: ', newComic._id);
  try {
    await db.comics.insert({ ...newComic, last_update: new Date() });
  } catch (e) {
    logger.info('Failed insert: ' + newComic._id)
    logger.error(e);
  }
}

const updateComic = async (_id, issues) => {
  logger.info('Update: ', _id);
  try {
    await db.comics.update({ _id }, { $currentDate: { last_update: true }, $push: { issues: { $each: issues } } });
  } catch (e) {
    logger.info('Failed update: ' + newComic._id)
    logger.error(e);
  }
}

const loadComic = async (_id, oldComic) => {
  const body = await py_request(`${process.env.SOURCE_URL}Comic/${_id}`);
  const newComic = await extract.details(body, _id);
  if (!newComic._id) return;
  if (!oldComic) {
    await insertComic(newComic);
  } else if ((oldComic.issues || []).length < (newComic.issues || []).length) {
    await updateComic(_id, newComic.issues);
  }
}


const run = async (db, url) => {
  let page = 1;
  while (page <= lastPage) {
    logger.info('Scrapping page: ' + page);
    const body = await py_request(`${url}?page=${page}`);
    const $ = cheerio.load(body);

    $('.listing a').map(async (i, el) => {
      const _id = $(el).attr('href').split('/').reverse()[0];
      const found = await db.comics.findOne({ _id }, { _id: 1, issues: 1 });
      await loadComic(_id, found);
    }).get();

    page++;
  }
}

const scrap = async () => {
  await run(db, `${process.env.SOURCE_URL}ComicList/Newest`);
  await run(db, `${process.env.SOURCE_URL}ComicList/LatestUpdate`);
  return true;
}

module.exports = { scrap }