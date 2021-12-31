const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
const ObjectID = require("mongodb").ObjectId;
require("dotenv").config();

const app = express();

app.use(cors());
app.use(bodyParser.json());

const port = 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zvmk2.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

app.get("/", (req, res) => {
  res.send("hello form feature crud server");
});

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const reviews = client.db(process.env.DB_NAME).collection("reviews");
  const comments = client.db(process.env.DB_NAME).collection("comments");
  const admins = client.db(process.env.DB_NAME).collection("admins");
  const votes = client.db(process.env.DB_NAME).collection("votes");
  votes.createIndex({"voterId": 1}, {unique: true})

  // users operations

  app.post("/addReview", (req, res) => {
    const { publish, useremail, username, title, review, imageLink, reviewDate } =
      req.body;

    reviews
      .insertOne({
        publish,
        useremail,
        username,
        title,
        review,
        imageLink,
        reviewDate,
      })
      .then((result) => {
        res.status(200).send(result.acknowledged);
      });
  });

  app.get("/getPublishedReviews", (req, res) => {
    const search = req.query.search;

    reviews
      .find({ publish: true, title: { $regex: search } })
      .toArray((err, documents) => {
        res.status(200).send(documents);
      });
  });

  app.post("/setUserComment", (req, res) => {
    const { contentId, username, useremail, comment, commentDate } = req.body;

    comments
      .insertOne({ contentId, username, useremail, comment, commentDate })
      .then((result) => {
        res.status(200).send(result.acknowledged);
      });
  });

  app.get("/comments", (req, res) => {
    comments.find({}).toArray((err, documents) => {
      res.status(200).send(documents);
    });
  });


  app.get("/getComments/:id", (req, res) => {
    const id = req.params.id;
    comments.find({ contentId: id }).toArray((err, documents) => {
      res.status(200).send(documents);
    });
  });

  app.post("/setUserVote", (req, res) => {
    const { contentId, username, useremail, voteDate, voterId } = req.body;

    votes
      .insertOne({ contentId, voterId, username, useremail, voteDate })
      .then((result) => {
        if (result) {
          res.status(200).send(result.acknowledged);
        }
      })
      .catch((err) => {
        if (err)
          res
            .status(501)
            .send("You Already voted, it's not possible to create new vote!");
      });
  });

  app.get("/votes", (req, res) => {
    votes.find({})
    .toArray((err, documents) => {
      res.status(200).send(documents)
    })
  })

  app.get("/getVotes/:id", (req, res) => {
    const id = req.params.id;

    votes.find({ contentId: id }).toArray((err, documents) => {
      res.status(200).send(documents);
    });
  });

  app.delete("/deleteComment/:id", (req, res) => {
    const id = req.params.id;
    comments
      .deleteOne({ _id: ObjectID(id) })
      .then((result) => {
        res.status(200).send(result.deletedCount > 0);
      })
      .catch((err) => console.log(err));
  });

  // admin's operations

  app.get("/checkAdmin/:email", (req, res) => {
    const email = req.params.email;

    admins.find({ role: "admin", email }).toArray((err, documents) => {
      res.status(200).send(documents.length > 0);
    });
  });

  app.get("/reviews", (req, res) => {
    reviews.find({}).toArray((err, documents) => {
      res.status(200).send(documents);
    });
  });

  app.patch("/updateReview/:id", (req, res) => {
    const id = req.params.id;
    const { title, review, imageLink } = req.body;

    reviews
      .updateOne(
        { _id: ObjectID(id) },
        {
          $set: { title, review, imageLink },
        }
      )
      .then((result) => {
        res.status(200).send(result.modifiedCount > 0);
      })
      .catch((err) => console.log(err));
  });

  app.patch("/updatePublishStatus/:id", (req, res) => {
    const { publish } = req.body;
    const id = req.params.id;

    reviews
      .updateOne(
        { _id: ObjectID(id) },
        {
          $set: { publish },
        }
      )
      .then((result) => {
        res.status(200).send(result.modifiedCount > 0);
      })
      .catch((err) => console.log(err));
  });

  app.delete("/deleteReview/:id", (req, res) => {
    const id = req.params.id;

    reviews
      .deleteOne({ _id: ObjectID(id) })
      .then((result) => {
        res.status(200).send(result.deletedCount > 0);
      })
      .catch((err) => console.log(err));
  });

  console.log("connected to mongo instance..");
});

app.listen(process.env.PORT || port );
