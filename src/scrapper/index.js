const cheerio = require('cheerio');
const mongoist = require('mongoist');
const db = mongoist(process.env.MONGO_URL, { useNewUrlParser: true });
const makeRequest = require('../source');
const extract = require('./extract');
const logger = require('./logger');
const data = require('../api/data');
let lastPage = 2;

const _genericEntityCountResolver = async (type) => {
  const length = (await data.retrieveEntities(type, { offset: 0, limit: Infinity })).length;
  return length;
}

const insertComic = async (newComic) => {
  logger.info('Insert: ', newComic._id);
  try {
    await db.comics.insert({ ...newComic, last_update: new Date() });
  } catch (e) {
    logger.error('Failed insert: ' + newComic._id)
    logger.error(e);
  }
  return;
}

const updateComic = async (_id, issues) => {
  logger.info('Update: ', _id);
  try {
    const { oldIssues } = await db.comics.findOne({ _id }, { issues: 1 })
    const nonRepeatedIssues = issues.filter(i => !oldIssues.some(oi => oi.id === i.id))
    await db.comics.update({ _id }, { $currentDate: { last_update: true }, $push: { issues: { $each: nonRepeatedIssues } } });
  } catch (e) {
    logger.error('Failed update: ' + newComic._id)
    logger.error(e);
  }
  return;
}

const updateInfo = async (db) => {
  const info = {
    last_update: (await data.retrieveLastUpdateDate()).last_update,
    issues: (await data.retrieveIssues())[0].count,
    genres: (await _genericEntityCountResolver('genres')),
    writers: (await _genericEntityCountResolver('writers')),
    publishers: (await _genericEntityCountResolver('publishers')),
    artists: (await _genericEntityCountResolver('artists')),
    comics: {
      completed: await data.retrieveTotalComicsByStatus('Completed'),
      ongoing: await data.retrieveTotalComicsByStatus('Ongoing')
    }
  };
  await db.info.remove({});
  await db.info.insert(info);
  return;
}

const loadComic = async (_id, oldComic) => {
  const { body } = await makeRequest(`${process.env.SOURCE_URL}Comic/${_id}`);
  const newComic = await extract.details(body, _id);
  if (!newComic._id) return;
  if (!oldComic) {
    await insertComic(newComic);
  } else if ((oldComic.issues || []).length < (newComic.issues || []).length) {
    await updateComic(_id, newComic.issues);
  }
  return;
}


const run = async (db, url) => {
  let page = 1;
  while (page <= lastPage) {
    logger.info('Page: ' + page);
    const { body } = await makeRequest(`${url}?page=${page}`);
    const $ = cheerio.load(body);

    const ids = $('.listing a').map((i, el) => $(el).attr('href').split('/').reverse()[0]).get();

    for (const _id of ids) {
      const found = await db.comics.findOne({ _id }, { _id: 1, issues: 1 });
      await loadComic(_id, found);
    }

    page++;
  }

  await updateInfo(db);

  return;
}

const scrap = async () => {
  logger.info('------------ New comics ------------');
  await run(db, `${process.env.SOURCE_URL}ComicList/Newest`);
  logger.info('------------ Comics updated ------------');
  await run(db, `${process.env.SOURCE_URL}ComicList/LatestUpdate`);
  return true;
}

module.exports = { scrap }