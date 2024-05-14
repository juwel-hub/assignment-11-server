const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();

const port = process.env.PORT || 5000;

//Must remove "/" from your production URL
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://deliciousfood-d9301.web.app",
      "https://deliciousfood-d9301.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zbpbuag.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// middleware
const logger = (req, res, next) => {
  console.log("log:info", req.method, req.url);
  next();
};

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  console.log("token from middleWare", token);
  if (!token) {
    return res.status(401).send({ message: "unAuthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production" ? true : false,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const featuredCollection = client
      .db("deliciousFoodDB")
      .collection("featureFood");
    const addFoodCollection = client
      .db("deliciousFoodDB")
      .collection("addFoods");

    // auth related api

    app.post("/jwt", logger, async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.cookie("token", token, cookieOptions).send({ success: true });
    });

    app.post("/logout", async (req, res) => {
      const user = req.body;
      console.log("logout", user);
      res
        .clearCookie("token", { ...cookieOptions, maxAge: 0 })
        .send({ success: true });
    });

    // update
    app.put("/update/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateFood = req.body;
      const food = {
        $set: {
          foodName: updateFood.foodName,
          foodImage: updateFood.foodImage,
          foodQuantity: updateFood.foodQuantity,
          pickupLocation: updateFood.pickupLocation,
          expireDateTime: updateFood.expireDateTime,
          additionalNotes: updateFood.additionalNotes,
          donatorImage: updateFood.donatorImage,
          donatorName: updateFood.donatorName,
          email: updateFood.email,
          foodStatus: updateFood.foodStatus,
        },
      };
      const result = await addFoodCollection.updateOne(filter, food, options);
      res.send(result);
    });

    app.get("/featureFood", async (req, res) => {
      const cursor = featuredCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/manageFood/:email", logger, verifyToken, async (req, res) => {
      console.log("cook cook", req.user);
      if (req.user.email !== req.params.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      let query = {};
      if (req.params?.email) {
        query = { email: req.params.email };
      }
      const result = await addFoodCollection
        .find({ email: req.params.email })
        .toArray();
      res.send(result);
    });
    // get add data from database

    app.get("/addFoods", async (req, res) => {
      const cursor = addFoodCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.delete("/deleteData/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await addFoodCollection.deleteOne(query);
      res.send(result);
    });

    // add food
    app.post("/addFoods", async (req, res) => {
      console.log(req.body);
      const result = await addFoodCollection.insertOne(req.body);
      res.send(result);
    });
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server side is running now");
});

app.listen(port, () => {
  console.log(`server is running on port: ${port}`);
});
