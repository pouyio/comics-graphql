const cheerio = require('cheerio');

const _get_url_last_part = (url) => url.replace(/^.*?\/([^\/]+?)(\?.+)?$/, '$1').toLowerCase();
const _get_url_img = (url) => url.replace(process.env.SOURCE_URL, '/img/');

const _get_linked_data = ($data, type) => {
  const id = _get_url_last_part($data.attr('href'));

  return {
    id,
    name: $data.text()
  };
}

const _get_person_data = ($data, type) => {
  const id = _get_url_last_part($data.attr('href'));
  const name = $data.text().split(' ');

  return {
    id,
    first_name: name[0],
    last_name: name[name.length - 1]
  };
}


const details = (body, _id) => {
  var p = new Promise((resolve, reject) => {
    var $ = cheerio.load(body);
    var $data = $('#leftside > .bigBarContainer:first-child > .barContent');
    if (!$data.length) resolve({});
    var cover_url = $('#rightside > .rightBox:first-child > .barContent img').attr('src');

    var json_data = {
      _id,
      writers: [],
      publishers: [],
      artists: [],
      genres: [],
      title: $data.find('.bigChar').text().trim(),
      issues: []
    };

    $data.find('p').each((index, item) => {
      var $item = $(item);
      var info_name = $item.find('.info:first-child').text().replace(/:/, '');

      switch (info_name) {
        case 'Genres':
          $item.find('a').each((_, genre) => {
            var genre_data = _get_linked_data($(genre), 'genres');

            json_data.genres.push(genre_data);

          });

          break;

        case 'Publisher':
          $item.find('a').each((_, publisher) => {
            var publisher_data = _get_linked_data($(publisher), 'publishers');

            json_data.publishers.push(publisher_data);

          });

          break;

        case 'Writer':
          $item.find('a').each((_, writer) => {
            var writer_data = _get_person_data($(writer), 'writers');

            json_data.writers.push(writer_data);

          });

          break;

        case 'Artist':
          $item.find('a').each((_, artist) => {
            var artist_data = _get_person_data($(artist), 'artists');

            json_data.artists.push(artist_data);

          });

          break;

        case 'Publication date':
          json_data.publication_date = $item.text().match(/publication date:\s+(.+)/i)[1].trim();
          break;

        case 'Status':
          json_data.status = $item.text().match(/status:\s+(.+?)\s+/i)[1].trim();
          break;

        case 'Summary':
          json_data.summary = $item.next().text().trim();
          break;
      }
    });

    $('.listing').find('tr').each((index, item) => {
      var $item = $(item);

      if ($item.find('a').length > 0) {
        var title = $item.find('a').text().trim();
        var issue_id = _get_url_last_part($item.find('a').attr('href'));
        var release_day = $item.find('td:last-child').text().trim();
        var issue = {
          id: issue_id,
          title: title,
          release_day: release_day
        };

        var match = title.match(/issue #(\d+)/i);

        if (!!match) {
          issue.number = Number(match[1]);
        }

        json_data.issues.push(issue);
      }
    });

    json_data.cover = _get_url_img(cover_url);
    resolve(json_data);

  });
  p.__name = 'Comic details';
  return p;
};

const issue = (body) => {
  const data = [];

  const lines = body.split('\n');

  for (const line of lines) {
    const match = line.match(/lstImages\.push\(["'](.*?)["']\);/i);

    if (!!match) {
      data.push(match[1]);
    }
  };

  return data;
};


module.exports = {
  details,
  issue
}
