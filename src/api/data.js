const { getDb } = require("../database");

const _ensureIssueExists = async (comic, issue, user) => {
  const hasComic = await (await getDb())
    .collection("users")
    .find({ _id: user, "comics._id": comic })
    .countDocuments();

  if (!hasComic) {
    return await (await getDb()).collection("users").updateOne(
      { _id: user },
      {
        $push: {
          comics: {
            _id: comic,
            wish: false,
            [issue]: { page: 0, read: false }
          }
        }
      }
    );
  }

  const aggregation = [];
  aggregation.push({ $match: { _id: user } });
  aggregation.push({ $unwind: "$comics" });
  aggregation.push({ $match: { "comics._id": comic } });
  aggregation.push({ $replaceRoot: { newRoot: "$comics" } });
  aggregation.push({ $match: { [issue]: { $exists: true } } });

  const hasIssue = await (await getDb())
    .collection("users")
    .aggregate(aggregation)
    .toArray();

  if (!hasIssue.length) {
    return await (await getDb())
      .collection("users")
      .updateOne(
        { _id: user, "comics._id": comic },
        { $set: { [`comics.$.${issue}`]: { page: 0, read: false } } }
      );
  }
  return;
};

const _comicExistsForUser = async (_id, user) =>
  (await getDb())
    .collection("users")
    .find({ _id: user, "comics._id": _id })
    .countDocuments();

const findComic = async _id =>
  (await getDb()).collection("comics").findOne({ _id });

const findUserComic = async (_id, user) => {
  const userComics = await (await getDb())
    .collection("users")
    .findOne(
      { _id: user, "comics._id": _id },
      { comics: { $elemMatch: { _id } } }
    );
  return userComics ? userComics.comics[0] : {};
};

const _retrieveEntity = async (entity, { id }) => {
  const type = `${entity}.id`;
  const $matchStage = { $match: { [type]: id } };
  const elem = await (await getDb())
    .collection("comics")
    .aggregate([
      $matchStage,
      { $project: { [entity]: 1 } },
      { $limit: 1 },
      { $unwind: `$${entity}` },
      $matchStage,
      { $group: { _id: `$${entity}` } }
    ])
    .toArray();
  return elem[0]._id;
};

const _retrieveEntities = async (entity, { search = "", offset, limit }) => {
  const _limit = limit ? limit : Infinity;
  const entities = await (await getDb())
    .collection("comics")
    .distinct(entity, {});
  const normalSearch = search.toLowerCase();
  return entities
    .filter(e => {
      if (!e) return false;
      if (e.name) {
        return e.name.toLowerCase().includes(normalSearch);
      }
      if (e.first_name || e.last_name) {
        return `${e.first_name} ${e.last_name}`
          .toLowerCase()
          .includes(normalSearch);
      }
    })
    .slice(offset, offset + _limit);
};

const randomComics = async ({ limit }) =>
  (await getDb())
    .collection("comics")
    .aggregate([{ $sample: { size: limit } }])
    .toArray();

const updateComicWish = async (_id, wish, user) => {
  let match = { _id: user };
  let update = {};

  if (await _comicExistsForUser(_id, user)) {
    match["comics._id"] = _id;
    update["$set"] = { "comics.$.wish": wish };
  } else {
    update["$push"] = { comics: { _id, wish } };
  }
  return (await getDb()).collection("users").updateOne(match, update);
};

const updateIssueForUser = async (_id, issue, isRead, page, user) => {
  const updateRead = isRead !== undefined;
  const updatePage = page !== undefined;
  if (!updateRead && !updatePage) return;

  const $set = {};
  if (updateRead) $set[`comics.$.${issue}.read`] = isRead;
  if (updatePage) $set[`comics.$.${issue}.page`] = page;
  await _ensureIssueExists(_id, issue, user);
  return (await getDb())
    .collection("users")
    .updateOne({ _id: user, "comics._id": _id }, { $set });
};

const comicWishForUser = async (user, _id) => {
  const result = await (await getDb())
    .collection("users")
    .aggregate([
      { $match: { _id: user } },
      { $unwind: "$comics" },
      { $replaceRoot: { newRoot: "$comics" } },
      { $match: { _id } },
      { $project: { wish: 1, _id: 0 } }
    ])
    .toArray();

  return result.length ? result[0].wish : false;
};

const comicsByUser = async user => {
  const comicsIds = await (await getDb())
    .collection("users")
    .aggregate([
      { $match: { _id: user } },
      { $unwind: "$comics" },
      { $match: { "comics.wish": true } },
      { $replaceRoot: { newRoot: "$comics" } },
      { $project: { _id: 1 } }
    ])
    .toArray();

  return comicsIds.map(async comic => await findComic(comic._id));
};

const setPages = async (comic, issue, pages) => {
  (await getDb())
    .collection("comics")
    .updateOne(
      { _id: comic, "issues.id": issue },
      { $set: { "issues.$.pages": pages } }
    );
};

const retrieveIssues = async () =>
  (await getDb())
    .collection("comics")
    .aggregate([
      { $match: { issues: { $type: 3 } } },
      { $project: { issues: { $size: "$issues" } } },
      { $group: { _id: null, count: { $sum: "$issues" } } }
    ])
    .toArray();

const retrieveTotalComicsByStatus = async status =>
  (await getDb()).collection("comics").countDocuments({ status });

const retrieveLastUpdateDate = async () =>
  (await getDb())
    .collection("comics")
    .find({}, { last_update: 1 })
    .sort({ last_update: -1 })
    .limit(1)
    .next();

const retrieveNew = async limit => {
  const lastDate = (
    await (await getDb())
      .collection("comics")
      .find({}, { last_update: 1 })
      .sort({ last_update: -1 })
      .limit(1)
      .next()
  ).last_update;
  const $gte = new Date(
    new Date(lastDate).setDate(new Date(lastDate).getDate() - 1)
  );

  return (await getDb())
    .collection("comics")
    .find({ last_update: { $gte } })
    .limit(limit)
    .toArray();
};

const retrieveComics = async (
  { search, genres, writers, publishers, artists, numberOfIssues },
  { offset, limit }
) => {
  const query = {};
  if (search) {
    query.$text = { $search: search };
  }
  if (genres.length) {
    query["genres.id"] = { $all: genres };
  }
  if (writers.length) {
    query["writers.id"] = { $all: writers };
  }
  if (publishers.length) {
    query["publishers.id"] = { $all: publishers };
  }
  if (artists.length) {
    query["artists.id"] = { $all: artists };
  }
  if (numberOfIssues !== undefined) {
    query[`issues.${numberOfIssues - 1}`] = { $exists: true };
  }

  return (await getDb())
    .collection("comics")
    .find(query)
    .project({ score: { $meta: "textScore" } })
    .sort({ score: { $meta: "textScore" } })
    .skip(offset)
    .limit(limit)
    .toArray();
};

const retrieveInfo = async () => {
  return (await getDb()).collection("info").findOne({});
};

const Utils = {
  genericEntityResolver: type => (root, { id }) =>
    _retrieveEntity(type, { id }),
  genericEntitiesResolver: type => (
    root,
    { search = "", offset = 0, limit = 10 }
  ) => _retrieveEntities(type, { search, offset, limit })
};

module.exports = {
  findComic,
  findUserComic,
  randomComics,
  updateComicWish,
  updateIssueForUser,
  comicWishForUser,
  comicsByUser,
  setPages,
  retrieveIssues,
  retrieveTotalComicsByStatus,
  retrieveLastUpdateDate,
  retrieveNew,
  retrieveComics,
  retrieveInfo,
  retrieveEntities: _retrieveEntities,
  Utils
};
