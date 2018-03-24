const PythonShell = require('python-shell');

const py_request = (url) => {

  return new Promise((resolve, reject) => {

    PythonShell.run('script.py', { mode: 'text', args: [url] }, (err, results) => {
      if (err) reject(err);
      resolve(results.join(''));
    });

  });

}

module.exports = py_request;