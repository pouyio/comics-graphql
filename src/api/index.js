const express = require("express");
const compression = require("compression");
const bodyParser = require("body-parser");
const cors = require("cors");
const { ApolloServer } = require("apollo-server-express");
const { typeDefs, resolvers } = require("./schema");
const { get_user_logged, login } = require("./auth");
const {
  img_proxy_cache,
  img_proxy,
  img_download,
  img_speed_limiter,
} = require("./img");
const { scrap } = require("../scrapper/index");

const app = express();

app.use(compression());
app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => res.send("ok!!!!"));
app.post("/login", login);
app.get("/img/*", img_proxy_cache, img_speed_limiter, img_proxy);
app.get("/proxy-img/*", img_download);
app.get("/scrap", scrap);

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV === "development",
  tracing: true,
  context: async ({ req, res }) => {
    const user = await get_user_logged(req, res);
    return { user };
  },
});

server.applyMiddleware({ app, path: "/graphql" });

module.exports = { app };
