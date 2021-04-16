const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { ApolloServer } = require("apollo-server-express");

const typeDefs = require("./schema/typeDefs.js");
const resolvers = require("./schema/resolvers.js");

mongoose.set("useNewUrlParser", true);
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useUnifiedTopology: true,
      useNewUrlParser: true
    });
  } catch (error) {
    console.log("Something went wrong with the database :(");
    return;
  }
  console.log("Yahoooo! Connected to the database.");
};

connectDB();

const app = express();
const port = process.env.PORT;

app.use(cookieParser());

const context = (req, res) => {
  let recruiter_id, candidate_id;

  let token = req.cookies;

  try {
    let rec = jwt.verify(token.recruiter, process.env.JWT_R);    
    recruiter_id = rec._id;
  } catch (e) {
    recruiter_id = null;
  }
  
  try {
    let cand = jwt.verify(token.candidate, process.env.JWT_C);
    candidate_id = cand._id;
  } catch (e) {
    candidate_id = null;
  }

  return { req, res, recruiter_id, candidate_id };
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => context(req, req.res),
  introspection: true,
  playground: true
});

server.applyMiddleware({ app, cors: true, path: "/" });
app.listen(port, () => console.log(`Hola! Listening at port ${port}.`));