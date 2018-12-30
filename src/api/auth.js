const jwt = require('jsonwebtoken');
const mongoist = require('mongoist');
const db = mongoist(process.env.MONGO_URL, { useNewUrlParser: true });

const check_token = async (req, res, next) => {
    try {
        req.user = await jwt.verify(req.headers.authorization, process.env.SECRET);
        next();
    } catch (e) {
        res.status(401).send(e);
    }
}

const login = async (req, res) => {
    if (await db.users.findOne({ _id: req.body.user })) {
        const token = jwt.sign(req.body.user, process.env.SECRET);
        res.send(token);
        return;
    }
    res.status(401).send('User not registered');
}

module.exports = { check_token, login };