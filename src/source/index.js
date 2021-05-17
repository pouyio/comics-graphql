const axios = require("axios");

const makeRequest = (url, img) => {
  const options = {
    method: "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36",
    },
    followAllRedirects: true,
  };

  if (url.includes("/Uploads/") || img) {
    options.responseType = "arraybuffer";
  }

  return axios
    .get(url,options)
    .then(({ headers, data }) => {
      return {
        body: Buffer.from(data, "binary"),
        type: headers["content-type"],
      };
    })
    .catch(console.log);
};

module.exports = { makeRequest };
