const express = require("express");
const crypto = require("crypto");
const path = require("path");
const mongoose = require("mongoose");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const dotenv = require("dotenv");

const cors = require("cors");

dotenv.config();

const app = express();

app.use(cors());
// connection
// const conn = mongoose.createConnection(
//   "mongodb+srv://file:file-dap190706@cluster0.flyo0.mongodb.net/file-uploader?retryWrites=true&w=majority",
//   {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   }
// );

const promise = mongoose.connect(
  "mongodb+srv://file:file-dap190706@cluster0.flyo0.mongodb.net/file-uploader?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const conn = mongoose.connection;
// init gfs
let gfs;
conn.once("open", () => {
  gfs = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "uploads",
  });
});

// Storage
const storage = new GridFsStorage({
  // url: process.env.MONGO_URL,
  db: promise,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err + "errorororororor");
        }

        const filename = buf.toString("hex") + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: "uploads",
        };
        resolve(fileInfo);
      });
    });
  },
});

const upload = multer({
  storage,
});

app.get("/", (req, res) => {
  gfs.find().toArray((err, files) => {
    // check if files
    if (!files || files.length === 0) {
      return res.status(404).json({
        err: "no files exist",
      });
    }

    return res.json(files);
  });
});

app.get("/test", (req, res) => {
  return res.json({ message: "ok" });
});

app.get("/files/:filename", async (req, res) => {
  gfs
    .find({
      filename: req.params.filename,
    })
    .toArray((err, files) => {
      if (!files || files.length === 0) {
        return res.status(404).json({
          err: "no files exist",
        });
      }

      gfs.openDownloadStreamByName(req.params.filename).pipe(res);
    });
});

app.post("/files", upload.single("file"), (req, res) => {
  res.status(201).json({
    file: req.file,
  });
});

app.post("/edit", (req, res) => {
  res.status(201).json({
    message: "post working",
  });
});

const port = process.env.PORT || 3333;

app.listen(port, () =>
  console.log(`Server running on ${port}, http://localhost:${port}`)
);
