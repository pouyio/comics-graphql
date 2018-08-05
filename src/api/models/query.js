const fs = require('fs');
const path = require('path');

const typeDef = `
type Query {
    # Plain log text from the scrapper
  log: String
}`;

const resolver = {
  Query: {
    log: (root) => {
      const filePath = path.join(process.cwd() + process.env.LOG_PATH);
      return fs.existsSync(filePath) ? fs.readFileSync(filePath) : '';
    }
  }
};


module.exports = {
  typeDef,
  resolver
}