const AWS = require('aws-sdk');
const makeRequest = require('../source');
let s3;

const _getS3 = () => {
    if (!s3) {
        s3 = new AWS.S3();
    }
    return s3;
}

const _findInBucket = (filename) => {
    return new Promise((resolve, reject) => {
        _getS3().headObject({
            Bucket: process.env.BUCKET_NAME,
            Key: filename
        }, (err, data) => {
            if (err || !data) {
                resolve();
            } else {
                resolve(data);
            }
        });
    })
}
const _saveToBucket = (filename, data, type) => {
    return new Promise((resolve, reject) => {
        _getS3().putObject({
            Bucket: process.env.BUCKET_NAME,
            Key: filename,
            Body: data,
            ACL: 'public-read',
            ContentType: type
        }, resolve);
    })
}

const img_proxy = async (req, res) => {
    const filename = req.params['0'];
    const data = await _findInBucket(filename);
    if (data) {
        res.redirect(`https://${process.env.BUCKET_NAME}.s3.eu-central-1.amazonaws.com/${filename}`);
    } else {
        const url = `${process.env.SOURCE_URL}${filename}`;
        try {
            const { body, type } = await makeRequest(url);

            const img = new Buffer.from(body, 'base64');
            res.header('Content-Type', type);
            res.header('Content-Length', img.length);
            res.end(img);
            _saveToBucket(filename, img, type);
        } catch (err) {
            console.log(err);
            res.end();
        }
    }
}

const img_download = async (req, res) => {
    const url = `${req.params['0']}`;
    try {
        const { body, type } = await makeRequest(url, true);
        const img = new Buffer.from(body, 'base64');
        res.header('Content-Type', type);
        res.header('Content-Length', img.length);
        res.end(img);
    } catch (err) {
        console.log(err);
        res.end();
    }
}

module.exports = {
    img_proxy,
    img_download
}