const MongoClient = require("mongodb").MongoClient;

let db;

const getDb = async () => {
  if (db) {
    return db;
  }
  const client = await MongoClient.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  db = client.db();
  return db;
};

module.exports = { getDb };
