const AWS = require('aws-sdk');
const RateLimit = require('express-rate-limit');
const { makeRequest } = require('../source');
let s3;

// venom
// http://localhost:4000/img/Uploads/Etc/5-15-2016/6354178807Untitled-1.jpg

const _getS3 = () => {
    if (!s3) {
        s3 = new AWS.S3();
    }
    return s3;
}

const _findInBucket = (filename) => {
    return new Promise((resolve) => {
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
    return new Promise((resolve) => {
        _getS3().putObject({
            Bucket: process.env.BUCKET_NAME,
            Key: filename,
            Body: data,
            ACL: 'public-read',
            ContentType: type
        }, resolve);
    })
}

const img_proxy_limiter = new RateLimit({
    windowMs: 5 * 1000,
    delayAfter: 5,
    max: 0,
    delayMs: 5 * 1000
});

const img_proxy = async (req, res) => {
    const filename = req.params['0'];
    const url = `${process.env.SOURCE_URL}${filename}`;
    try {
        const { body, type } = await makeRequest(url);
        res.header('Content-Type', type);
        res.header('Content-Length', body.length);
        res.end(body);
        _saveToBucket(filename, body, type);
    } catch (err) {
        console.log(err);
        res.end();
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

const img_proxy_cache = async (req, res, next) => {
    const filename = req.params['0'];
    const data = await _findInBucket(filename);
    if (data) {
        res.redirect(`https://s3.eu-central-1.amazonaws.com/${process.env.BUCKET_NAME}/${filename}`);
    } else {
        next();
    }
}

module.exports = {
    img_proxy_limiter,
    img_proxy,
    img_download,
    img_proxy_cache
}