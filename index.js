const express = require("express");
const cors = require("cors");
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

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zbpbuag.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

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

    app.get("/featureFood", async (req, res) => {
      const cursor = featuredCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/manageFood/:email", async (req, res) => {
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
