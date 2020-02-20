const jwt = require("jsonwebtoken");
const { getDb } = require("../database");

const { AuthenticationError } = require("apollo-server-express");

const get_user_logged = async (req, res, next) => {
  try {
    return await jwt.verify(req.headers.authorization, process.env.SECRET);
  } catch (e) {
    throw new AuthenticationError(e);
  }
};

const login = async (req, res) => {
  if (
    await (await getDb()).collection("users").findOne({ _id: req.body.user })
  ) {
    const token = jwt.sign(req.body.user, process.env.SECRET);
    res.send(token);
    return;
  }
  res.status(401).send("User not registered");
};

module.exports = { get_user_logged, login };
