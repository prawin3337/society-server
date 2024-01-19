import { Router, Request, Response } from "express";
import mysqldump from 'mysqldump';
const router = Router();

var fs = require('fs');

const dir = "./data/";

router.post('/', async (req, res) => {
  const {username, password} = req.body;
  if(username !== "appadmin" || password !== "Society@02$") {
    res.status(500).json({
      status: false,
      message: "Auth error!",
      // result: result
    });
    return;
  }
  const fileName = `society-db-${new Date().getTime()}.sql`;
  const filePath = dir+fileName;

  await mysqldump({
    connection: {
      host: 'localhost',
      user: process.env.DB_USER || "",
      password: process.env.DB_PASSWORD || "",
      database: 'society-db',
    },
    dumpToFile: filePath,
  });

  fs.readFile(filePath, 'binary', (err: any, data: any) => {
    if (err) {
      res.status(500).json({
          status: false,
          message: "File download fail.",
          // result: result
      });
      return;
    }

    res.setHeader('Content-Type', 'text');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

    res.write(data, 'binary');
    res.end(() => {
      // deleteFile(filePath, fileName);
    });
  });
});

module.exports = router;
