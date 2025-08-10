import express from "express";
import path from "path";
import bodyParser from "body-parser";
import { LastStickerScrapper } from "./utils/laststicker.scrapper";
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

app.post("/submit", async (_req, _res) => {
  try {
    const url = _req.body.url;
    const file = await LastStickerScrapper.start(url, "album", {
      grid: true,
      clearCache: false,
      // isBrowser: true,
      // withAuth: true,
    });

    _res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    _res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + "album.xlsx"
    );
    return file.excel.workbook.xlsx.write(_res).then(() => {
      _res.status(200).end();
    });
  } catch (error) {
    console.log(error);
    _res.status(500).send("Error");
  }
});

app.get("/", (_, _res) => {
  _res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(3000, () => console.log("Server ready on port 3000."));

module.exports = app;
