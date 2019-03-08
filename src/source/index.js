const { get } = require('cloudscraper');

const makeRequest = (url, img) => {

    return new Promise((resolve, reject) => {

        const options = {
            url,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36'
            },
            followAllRedirects: true
        };

        if (url.includes('/Uploads/') || img) {
            options.encoding = null;
        }

        get(options, (error, { headers }, body) => {
            if (error) {
                reject(error);
            } else {
                resolve({ body, type: headers['content-type'] })
            }
        });

    });

}

module.exports = { makeRequest };