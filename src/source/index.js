const { request } = require('cloudscraper');

const makeRequest = (url, img) => {

    return new Promise((resolve, reject) => {

        const options = { method: 'GET', url, followAllRedirects: true };

        if (url.includes('/Uploads/') || img) {
            options.encoding = null;
        }

        request(options, (error, { headers }, body) => {
            if (error) {
                reject(error);
            } else {
                resolve({ body, type: headers['content-type'] })
            }
        });

    });

}

module.exports = { makeRequest };