import express from "express";
import { PrismaClient, Prisma, prisma } from "@prisma/client";
import { env, nextTick } from "process";
import "dotenv/config";
import _ from "lodash";

const { format } = require("util");
const client = new PrismaClient();
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { Storage } = require("@google-cloud/storage");
const storage = new Storage();

const upload = multer({
  storage: multer.memoryStorage({}),
});

const bucket = storage.bucket(env.GCLOUD_STORAGE_BUCKET);

//파일 전송
router.post(
  "/upload/:boardType",
  upload.single("file"),
  async (req, res, next) => {
    try {
      let { exist_url, idx } = req.body;
      let boardType = req.params.boardType;
      const fileExist = boardType + "/" + exist_url;
      idx = parseInt(idx);

      if (exist_url != "null" && exist_url) {
        deleteFile();
      }

      async function deleteFile() {
        await storage.bucket("booster-bucket").file(fileExist).delete();
      }
      //deleteFile().catch(console.error);

      const [files] = await storage.bucket("booster-bucket").getFiles();

      files.forEach((file) => {
        if (file.name == fileExist) {
        }
      });
      let file_url = "";

      if (!req.file) {
      } else {
        // const filenames = req.files! as Array<Express.Multer.File>;
        // const filename = filenames.map((file: any) => file.filename);
        let board = boardType;
        if (boardType == "insight-quill") {
          board = "insight";
        }
        const blob = bucket.file(
          board + "/" + `${Date.now()}${path.extname(req.file.originalname)}`
        );
        file_url = blob.name.split("/")[1];

        const blobStream = blob.createWriteStream({
          resumable: false,
        });

        blobStream.on("error", (err) => {
          next(err);
        });

        blobStream.on("finish", async () => {
          const publicUrl = format(
            `https://storage.googleapis.com/${bucket.name}/${blob.name}`
          );
        });

        blobStream.end(req.file.buffer);
      }
      switch (boardType) {
        case "topic": {
          await client.write_topic.update({
            where: {
              idx: idx,
            },
            data: {
              file_url: file_url,
            },
          });

          break;
        }
        case "insight": {
          await client.write_insight.update({
            where: {
              idx: idx,
            },
            data: {
              file_url: file_url,
            },
          });

          break;
        }
        case "business": {
          await client.business.update({
            where: {
              idx: idx,
            },
            data: {
              business_url: file_url,
            },
          });

          break;
        }
        case "home": {
          await client.main_image.update({
            where: {
              idx: idx,
            },
            data: {
              image_url: file_url,
            },
          });

          break;
        }
        case "adbanner": {
          await client.ad_banner.update({
            where: {
              idx: idx,
            },
            data: {
              image_url: file_url,
            },
          });

          break;
        }
        case "insight-quill": {
          await client.insight_quill.create({
            data: {
              image_url: file_url,
            },
          });

          break;
        }
        default: {
          //statements;
          console.log("디폴트");
          break;
        }
      }
      res
        .status(200)
        .json({ msg: "파일을 업로드 했습니다.", file_url: file_url });
    } catch (error) {
      next(error);
    }
  }
);

//파일삭제
router.post("/upload/delete/:boardType", async (req, res, next) => {
  try {
    const { file_url } = req.body;
    const boardType = req.params.boardType;
    const fileExist = boardType + "/" + file_url;
    if (file_url.length > 2) {
      deleteFile();
    }

    async function deleteFile() {
      await storage.bucket("booster-bucket").file(fileExist).delete();
    }
    res.status(200).send("파일을 삭제 했습니다.");
  } catch (err) {
    next(err);
  }
});

function listFiles(filename) {
  // Lists files in the bucket
  const [files] = storage.bucket("booster-bucket").getFiles();

  const result = "";
  files.forEach((file) => {
    if (file.name == filename) {
      console.log("존재");
    } else {
    }
  });
}

module.exports = router;
