import path from "path";
import express from "express";


import routes from "./app/routes/routes.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(routes);

app.get("/", (req, res) => {
  res.sendFile(path.resolve("./src/public/index.html"));
});

app.use((err, req, res, next) => {
  if (err && err.errorCode) {
    res.status(err.errorCode).json(err.message);
  } else if (err) {
    res.status(500).json("Internal server error");
  }
});

app.all("*", (req, res, next) => {
  res.status(404).json("Not found");
});

export { app };
