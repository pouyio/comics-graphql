require("dotenv").load();
const cheerio = require("cheerio");
const { defer } = require("@defer/client");
const { getDb } = require("../database");
const { makeRequest } = require("../source");
const extract = require("../scrapper/extract");
const logger = require("../scrapper/logger");
const data = require("../api/data");
let lastPage = 5;

const _genericEntityCountResolver = async (type) => {
  const length = (
    await data.retrieveEntities(type, { offset: 0, limit: Infinity })
  ).length;
  return length;
};

const insertComic = async (newComic) => {
  logger.info("Insert: ", newComic._id);
  try {
    await (await getDb()).collection("comics").insertOne({
      ...newComic,
      last_update: new Date(),
    });
  } catch (e) {
    logger.error("Failed insert: " + newComic._id);
    logger.error(e);
  }
  return;
};

const updateComic = async (_id, totalIssues) => {
  logger.info("Update: ", _id);
  try {
    const { issues } = await (await getDb())
      .collection("comics")
      .findOne({ _id }, { issues: 1 });
    const nonRepeatedIssues = totalIssues.filter(
      (i) => !issues.some((oi) => oi.id === i.id)
    );
    await (await getDb()).collection("comics").updateOne(
      { _id },
      {
        $currentDate: { last_update: true },
        $push: { issues: { $each: nonRepeatedIssues } },
      }
    );
  } catch (e) {
    logger.error("Failed update: " + newComic._id);
    logger.error(e);
  }
  return;
};

const updateInfo = async (db) => {
  const info = {
    last_update: (await data.retrieveLastUpdateDate()).last_update,
    issues: (await data.retrieveIssues())[0].count,
    genres: await _genericEntityCountResolver("genres"),
    writers: await _genericEntityCountResolver("writers"),
    publishers: await _genericEntityCountResolver("publishers"),
    artists: await _genericEntityCountResolver("artists"),
    comics: {
      completed: await data.retrieveTotalComicsByStatus("Completed"),
      ongoing: await data.retrieveTotalComicsByStatus("Ongoing"),
    },
  };
  await db.collection("info").deleteMany({});
  await db.collection("info").insertOne(info);
  return;
};

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
};

const run = async (db, url) => {
  let page = 1;
  while (page <= lastPage) {
    logger.info("Page: " + page);
    const { body } = await makeRequest(`${url}?page=${page}`);
    const $ = cheerio.load(body);

    const ids = $(".list-comic a:not(.hot-label)")
      .map((i, el) => $(el).attr("href").split("/").reverse()[0])
      .get();

    const founds = await db
      .collection("comics")
      .find({ _id: { $in: ids } }, { _id: 1, issues: 1 })
      .toArray();

    for (const _id of ids) {
      const found = founds.find((c) => c._id === _id);
      await loadComic(_id, found);
    }

    page++;
  }

  await updateInfo(db);

  return;
};

const scrap = async () => {
  const db = await getDb();
  logger.info("------------ New comics ------------");
  await run(db, `${process.env.SOURCE_URL}ComicList/Newest`);
  logger.info("------------ Comics updated ------------");
  await run(db, `${process.env.SOURCE_URL}ComicList/LatestUpdate`);
  return true;
};

// scrap();
module.exports = defer.cron(scrap, "0 0 * * *");
