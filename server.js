const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const Product = require("./models/Product");

const PORT = process.env.PORT || 4000;

mongoose.connect(process.env.MONGO_URI)
  .then(()=>console.log("MongoDB conectado"))
  .catch(err=>console.error(err));

app.get("/api/products", async (req,res)=>{
  const products = await Product.find();
  res.json(products);
});

app.get("/", (req,res)=>{
  res.sendFile(path.join(__dirname,"public","index.html"));
});

app.listen(PORT, ()=> console.log("Servidor en puerto "+PORT));
