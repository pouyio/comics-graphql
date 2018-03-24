const cloudscraper = require('cloudscraper');

const make_request = url => new Promise((resolve, reject) => {

  let encoding = 'utf8';

  if (url.includes('/Uploads/')) {
    encoding = null;
  }

  cloudscraper.request({ url, encoding, method: 'GET' }, (error, response, body) => {

    if (error) {
      reject(error);
      return;
    }

    resolve({ body, type: response.headers['content-type'] });

  });
});

const issue = (body) => {
  const data = [];

  const lines = body.split('\n');

  for (var line of lines) {
    var match = line.match(/lstImages\.push\(["'](.*?)["']\);/i);

    if (!!match) {
      data.push(match[1]);
    }
  };

  return Promise.resolve(data);
};

Object.assign(module.exports, {
  makeRequest: make_request,
  issue
})
