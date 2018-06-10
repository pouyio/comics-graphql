const cloudscraper = require('cloudscraper')
const PythonShell = require('python-shell')

const _concatenate = (resultConstructor, ...arrays) => {
    let totalLength = 0;
    let result;
    let offset = 0;

    for (let arr of arrays) {
        totalLength += arr.length;
    }

    result = new resultConstructor(totalLength);

    for (let arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}

module.exports = (url, img) => {

    return new Promise((resolve, reject) => {

        const options = { args: [url] };
        const arrs = [];
        const isImage = url.includes('/Uploads/') || img;

        if (isImage) {
            options.encoding = null;
            options.mode = 'binary';
        }

        const pyshell = PythonShell.run('script.py', options, (err, response) => {
            if (err) reject(err);
            if (!isImage) {
                resolve({ body: response.join('\n') })
            }
        });

        if (isImage) {
            pyshell.stdout.on('data', (body) => {
                arrs.push(body);
            });

            pyshell.end(() => {
                const body = _concatenate(Uint8Array, ...arrs);
                resolve({ body, type: 'image/jpeg' })
            })
        }


    });

}