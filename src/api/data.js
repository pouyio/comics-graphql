const _mongoist = require('mongoist');
const db = _mongoist(process.env.MONGO_URL);

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

const _comicExistsForUser = (_id, user) => db.users.findAsCursor({ _id: user, 'comics._id': _id }).count();

const findComic = (_id) => db.comics.findOne({ _id });

const findUserComic = async (_id, user) => {
    const userComics = await db.users.findOne(
        { _id: user, 'comics._id': _id },
        { comics: { $elemMatch: { _id } } }
    );
    return userComics ? userComics.comics[0] : {};
}

const randomComics = ({ limit }) => db.comics.aggregate([{ $sample: { size: limit } }]);


const updateComicWish = async (_id, wish, user) => {
    let match = { _id: user };
    let update = {};

    if (await _comicExistsForUser(_id, user)) {
        match['comics._id'] = _id;
        update['$set'] = { 'comics.$.wish': wish };
    } else {
        update['$push'] = { 'comics': { _id, wish } };
    }
    return db.users.update(match, update);
}

const updateIssueForUser = async (_id, issue, isRead, page, user) => {
    const updateRead = isRead !== undefined;
    const updatePage = page !== undefined;
    if (!updateRead && !updatePage) return;

    const $set = {};
    if (updateRead) $set[`comics.$.${issue}.read`] = isRead;
    if (updatePage) $set[`comics.$.${issue}.page`] = page;
    await _ensureIssueExists(_id, issue, user);
    return db.users.update({ _id: user, 'comics._id': _id }, { $set });
}

const comicWishForUser = async (user, _id) => {

    const result = await db.users.aggregate([
        { $match: { _id: user } },
        { $unwind: '$comics' },
        { $replaceRoot: { newRoot: "$comics" } },
        { $match: { _id } },
        { $project: { wish: 1, _id: 0 } }
    ]);

    return result.length ? result[0].wish : false;
}

const comicsByUser = async (user) => {
    const comicsIds = await db.users.aggregate([
        { $match: { _id: user } },
        { $unwind: '$comics' },
        { $match: { 'comics.wish': true } },
        { $replaceRoot: { newRoot: "$comics" } },
        { $project: { _id: 1 } }
    ]);

    return comicsIds.map(async comic => await findComic(comic._id))
}

const setPages = async (comic, issue, pages) => {
    db.comics.update({ _id: comic, 'issues.id': issue }, { $set: { 'issues.$.pages': pages } });
}

const retrieveEntity = async (entity, { id }) => {
    const type = `${entity}.id`;
    const $matchStage = { $match: { [type]: id } };
    const elem = await db.comics.aggregate([
        $matchStage,
        { $project: { [entity]: 1 } },
        { $limit: 1 },
        { $unwind: `$${entity}` },
        $matchStage,
        { $group: { _id: `$${entity}` } },
    ]);
    return elem[0]._id;
}

const retrieveEntities = async (entity, { search = '', offset, limit }) => {
    const _limit = limit ? limit : Infinity;
    const entities = await db.comics.distinct(entity);
    const normalSearch = search.toLowerCase();
    return entities.filter(e => {
        if (!e) return false;
        if (e.name) {
            return e.name.toLowerCase().includes(normalSearch)
        }
        if (e.first_name || e.last_name) {
            return `${e.first_name} ${e.last_name}`.toLowerCase().includes(normalSearch)
        }
    }).slice(offset, offset + _limit)
}

const retrieveIssues = () => db.comics.aggregate([
    { $match: { issues: { $type: 3 } } },
    { $project: { issues: { '$size': '$issues' } } },
    { $group: { _id: null, count: { $sum: '$issues' } } }
]);

const retrieveTotalComicsByStatus = (status) => db.comics.count({ status });

const retrieveLastUpdateDate = () => db.comics.findAsCursor({}, { last_update: 1 }).sort({ last_update: -1 }).limit(1).next();

const retrieveNew = async () => {
    const lastDate = (await db.comics.findAsCursor({}, { last_update: 1 }).sort({ last_update: -1 }).limit(1).next()).last_update;
    const $gte = new Date(new Date(lastDate).setDate(new Date(lastDate).getDate() - 1));

    return db.comics.find({ 'last_update': { $gte } });

}

const retrieveComics = ({ search, genres, writers, publishers, artists, numberOfIssues }, { offset, limit }) => {
    const query = {};
    if (search) {
        query.$text = { $search: search };
    }
    if (genres.length) {
        query['genres.id'] = { $all: genres }
    }
    if (writers.length) {
        query['writers.id'] = { $all: writers }
    }
    if (publishers.length) {
        query['publishers.id'] = { $all: publishers }
    }
    if (artists.length) {
        query['artists.id'] = { $all: artists }
    }
    if (numberOfIssues !== undefined) {
        query[`issues.${numberOfIssues - 1}`] = { $exists: true };
    }

    return db.comics.findAsCursor(query, { score: { $meta: "textScore" } })
        .sort({ score: { $meta: "textScore" } })
        .skip(offset)
        .limit(limit)
        .toArray();
}

module.exports = {
    findComic,
    findUserComic,
    randomComics,
    updateComicWish,
    updateIssueForUser,
    comicWishForUser,
    comicsByUser,
    setPages,
    retrieveEntities,
    retrieveEntity,
    retrieveIssues,
    retrieveTotalComicsByStatus,
    retrieveLastUpdateDate,
    retrieveNew,
    retrieveComics
}