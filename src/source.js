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

Object.assign(module.exports, {
  makeRequest: make_request
})
