const hooman = require("hooman");

const makeRequest = (url, img) => {
  const options = {
    method: "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36",
    },
    followAllRedirects: true,
  };

  if (url.includes("/Uploads/") || img) {
    options.encoding = null;
  }

  return hooman
    .get(url, options)
    .then(({ headers, body }) => {
      return { body, type: headers["content-type"] };
    })
    .catch(console.log);
};

module.exports = { makeRequest };
