import express, { query } from "express";
import { PrismaClient, Prisma, prisma } from "@prisma/client";
import { body, validationResult } from "express-validator";
import { writeSchema } from "../schema/write-schema";
import { env, nextTick } from "process";
import "dotenv/config";
import _ from "lodash";
import session from "express-session";

const client = new PrismaClient();
const router = express.Router();
const multer = require("multer");

const fs = require("fs");

const cookieParser = require("cookie-parser");
const { Storage } = require("@google-cloud/storage");
const storage = new Storage();

const upload = multer({
  storage: multer.memoryStorage({}),
});

const bucket = storage.bucket(env.GCLOUD_STORAGE_BUCKET);

router.use(
  session({
    secret: "viewCheck",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 6 },
  })
);

router.use(cookieParser());

//토픽 조회
router.post("/topic/list", async (req, res, next) => {
  try {
    const { member_idx, sector } = req.body;
    const result = await client.$queryRaw`

      SELECT 
            @ROWNUM := @ROWNUM +1 AS rn, TB.*
      FROM
          (SELECT *,
          (SELECT COUNT(*) FROM write_topic WHERE wr_parent = A.idx) AS commentCnt,
          (SELECT COUNT(*) FROM write_topic_like WHERE topic_idx = A.idx) AS likeCnt,
          (SELECT bo_subject FROM board WHERE idx = A.board AND sector = "topic") AS board_name,
          (SELECT bo_table FROM board WHERE idx = A.board AND sector = "topic") AS board_table,
          (SELECT IFNULL(NULL, 'Y') AS Y FROM write_scrap WHERE board_idx = A.idx AND sector = ${sector} AND member_idx = ${member_idx}) AS scrap,
          (SELECT mb_nick FROM member WHERE mb_id = A.mb_id) AS mb_nick
            FROM write_topic A where wr_parent is null ORDER BY idx DESC) AS TB,
          (SELECT @ROWNUM :=0 ) rn`;

    const countResult = await client.write_topic.aggregate({
      _sum: {
        wr_view: true,
        wr_good: true,
      },
    });

    const boardCountResult = await client.board.aggregate({
      _count: {
        idx: true,
      },
    });

    res.status(200).json({
      success: true,
      result: result,
      count: countResult,
      boardCount: boardCountResult,
      msg: "토픽 조회완료",
    });
  } catch (error) {
    next(error);
  }
});

//토픽 상세 조회
router.post("/topic/detail/:id", async (req, res, next) => {
  try {
    const { member_idx, sector } = req.body;
    const offset = new Date().getTimezoneOffset() * 60000;
    const idx = parseInt(req.params.id);

    if (idx) {
      if (req.cookies.viewCheck != idx) {
        res.cookie("viewCheck", idx, {
          expires: new Date(Date.now() + 86400000),
          httpOnly: true,
        });
        const view = await client.write_topic.update({
          where: {
            idx: idx,
          },
          data: {
            wr_view: {
              increment: 1,
            },
          },
        });
      }
    }

    const result = await client.$queryRaw(
      Prisma.sql`SELECT *,
        (SELECT COUNT(*) FROM write_topic WHERE wr_parent = ${idx}) AS commentCnt,
        (SELECT COUNT(*) FROM write_topic_like WHERE topic_idx = ${idx}) AS likeCnt,
        (SELECT bo_subject FROM board WHERE idx = A.board AND sector = "topic") AS board_name,
        (SELECT bo_table FROM board WHERE idx = A.board AND sector = ${sector}) AS board_table,
        (SELECT IFNULL(NULL, 'Y') AS Y FROM write_scrap WHERE board_idx = ${idx} AND sector = ${sector} AND member_idx = ${member_idx}) AS scrap,
        (SELECT mb_nick FROM member WHERE mb_id = A.mb_id) AS mb_nick
        FROM write_topic A WHERE idx = ${idx}`
    );
    res.status(200).json({
      success: true,
      result: result,
      msg: "토픽 상세조회완료",
    });
  } catch (error) {
    next(error);
  }
});

//토픽 댓글 카운트
router.get("/topic/commentcount/:id", async (req, res, next) => {
  try {
    const idx = parseInt(req.params.id);
    const result = await client.write_topic.findMany({
      where: {
        wr_parent: idx,
      },
    });
    res.status(200).json({
      success: true,
      result: result,
      msg: "토픽 상세조회완료",
    });
  } catch (error) {
    next(error);
  }
});

//토픽 대댓글 카운트
router.get("/topic/replycount/:id", async (req, res, next) => {
  try {
    const idx = parseInt(req.params.id);
    const result = await client.write_topic.findMany({
      where: {
        wr_parent2: idx,
      },
    });
    res.status(200).json({
      success: true,
      result: result,
      msg: "토픽 상세조회완료",
    });
  } catch (error) {
    next(error);
  }
});

//토픽 댓글 조회
router.get("/topic/comment/:id", async (req, res, next) => {
  try {
    const idx = parseInt(req.params.id);

    // const result = await client.$queryRaw(
    //   Prisma.sql`select *, (select count(*) from write_topic_like where topic_idx = a.idx) as likeCnt from write_topic a where wr_parent = ${idx} and wr_is_comment = 1`
    // );
    const result = await client.$queryRaw(
      Prisma.sql`select *,(select count(*) from write_topic_like where topic_idx = a.idx) as likeCnt,ifnull(wr_parent2, a.idx) as wr_parent2, (select count(*)-1 from write_topic where wr_parent2 = a.idx) as replyCnt from write_topic a where wr_parent = ${idx} order by wr_parent2`
    );
    res.status(200).json({
      success: true,
      result: result,
      msg: "토픽 상세조회완료",
    });
  } catch (error) {
    next(error);
  }
});

//토픽 대댓글 조회
router.get("/topic/reply/:id", async (req, res, next) => {
  try {
    const idx = parseInt(req.params.id);

    const result = await client.$queryRaw(
      Prisma.sql`select *, (select count(*) from write_topic_like where topic_idx = a.idx) as likeCnt from write_topic a where wr_parent2 = ${idx} and wr_is_comment2 = 1`
    );
    res.status(200).json({
      success: true,
      result: result,
      msg: "토픽 상세조회완료",
    });
  } catch (error) {
    next(error);
  }
});

//토픽 등록
router.post("/topic/write", writeSchema, async (req, res, next) => {
  console.log(req.body);
  try {
    const {
      wr_subject,
      wr_content,
      wr_ip,
      mb_name,
      board,
      mb_id,
      wr_parent,
      wr_parent2,
      wr_is_comment,
      wr_is_comment2,
    } = req.body;
    const errors = validationResult(req.body);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    console.log(errors);
    // const filenames = req.files! as Array<Express.Multer.File>
    // //const file_url = filenames.map(file => file.filename)
    // const file_url = req.files.key;
    const result = await client.write_topic.create({
      data: {
        wr_subject: wr_subject,
        wr_content: wr_content,
        wr_ip: wr_ip,
        mb_id: mb_id,
        mb_name: mb_name,
        wr_parent: wr_parent,
        wr_parent2: wr_parent2,
        wr_is_comment: wr_is_comment,
        wr_is_comment2: wr_is_comment2,
        board: board ? parseInt(board) : null,

        //file_url: JSON.stringify(file_url)
      },
    });

    res.status(200).json({
      success: true,
      result: result,
      msg: "토픽 등록완료",
    });
  } catch (error) {
    next(error);
  }
});

//토픽 수정
router.post("/topic/update/:id", upload.any(), async (req, res, next) => {
  try {
    const offset = new Date().getTimezoneOffset() * 60000;
    const today = new Date(Date.now() - offset);

    const { wr_subject, wr_content, board } = req.body;
    const idx = parseInt(req.params.id);
    // const filenames = req.files! as Array<Express.Multer.File>
    // const file_url = filenames.map(file => file.filename)
    const result = await client.write_topic.update({
      where: {
        idx: idx,
      },
      data: {
        wr_subject: wr_subject,
        wr_content: wr_content,
        board: board,
        wr_update: today,
        //file_url: JSON.stringify(file_url)
      },
    });
    res.status(200).json({
      success: true,
      result: result,
      msg: "토픽 수정완료",
    });
  } catch (error) {
    next(error);
  }
});

//토픽 삭제
router.post("/topic/delete/:id", async (req, res, next) => {
  try {
    const idx = parseInt(req.params.id);
    const result = await client.write_topic.delete({
      where: {
        idx: idx,
      },
    });

    res.status(200).json({
      success: true,
      result: result,
      msg: "토픽 삭제완료",
    });
  } catch (error) {
    next(error);
  }
});

//토픽 파일업로드
router.post("/topic/upload/:id", upload.any(), async function (req, res, next) {
  console.log("파일 이름 : ", req.files);
  try {
    //console.log(upload)

    if (req.files) {
      const idx = parseInt(req.params.id);
      const filenames = req.files! as Array<Express.Multer.File>;
      const file_url = filenames.map((file: any) => file.key);
      //const exist_url = '1646294724563.jpg';
      const exist_url = req.body.exist_url;

      // s3.getObject(
      //   {
      //     Bucket: "booster-bucket", // 사용자 버켓 이름
      //     Key: "topic/" + exist_url, // 버켓 내 경로
      //   },
      //   (err, data) => {
      //     if (err) {
      //       console.log("미존재");
      //     } else {
      //       s3.deleteObject(
      //         {
      //           Bucket: "booster-bucket",
      //           Key: "topic/" + exist_url,
      //         },
      //         (err, data) => {
      //           if (err) {
      //             throw err;
      //           }
      //           console.log("기존파일 삭제성공");
      //         }

      //       );
      //     }
      //   }
      // );
      const result = await client.write_topic.update({
        where: {
          idx: idx,
        },
        data: {
          file_url: JSON.stringify(file_url),
        },
      });
      res.status(200).json({
        success: true,
        result: result,
        msg: "토픽 파일업로드 성공",
      });
    }
  } catch (error) {
    next(error);
  }
});

//토픽 파일삭제
router.post("/topic/upload/delete/:id", async function (req, res, next) {
  try {
    const file_url = req.body.file_url;
    const idx = parseInt(req.params.id);
    console.log(file_url);

    fs.readdir("./uploads/", function (err, fileList) {
      console.log("./uploads/" + file_url);
    });

    // s3.deleteObject(
    //   {
    //     Bucket: "booster-bucket", // 사용자 버켓 이름
    //     Key: "topic/" + file_url, // 버켓 내 경로
    //   },
    //   (err, data) => {
    //     if (err) {
    //       throw err;
    //     }
    //     console.log("s3 deleteObject ", data);
    //   }
    // );

    fs.unlink("./uploads/" + file_url, (err) => {
      console.log(file_url);
    });

    const result = await client.write_topic.update({
      where: {
        idx: idx,
      },
      data: {
        file_url: "",
      },
    });
    res.status(200).json({
      success: true,
      result: result,
      msg: "토픽 파일삭제 성공",
    });
  } catch (error) {
    next(error);
  }
});

//토픽 좋아요 체크
router.post("/topic/like/:id", async function (req, res, next) {
  try {
    const { member_idx } = req.body;
    const topic_idx = parseInt(req.params.id);

    const result = await client.write_topic_like.findMany({
      where: {
        member_idx: member_idx,
        topic_idx: topic_idx,
      },
    });

    res.status(200).json({
      success: true,
      result: result,
      msg: "토픽 좋아요 체크 성공",
    });
  } catch (error) {
    next(error);
  }
});

//토픽 좋아요 입력
router.post("/topic/like/insert/:id", async function (req, res, next) {
  try {
    const topic_idx = parseInt(req.params.id);
    const { member_idx } = req.body;
    const result = await client.$queryRaw(
      Prisma.sql`INSERT INTO write_topic_like (member_idx, topic_idx) SELECT ${member_idx}, ${topic_idx} FROM DUAL WHERE NOT EXISTS (SELECT member_idx, topic_idx FROM write_topic_like WHERE member_idx = ${member_idx} AND topic_idx = ${topic_idx})`
    );

    res.status(200).json({
      success: true,
      result: result,
      msg: "토픽 좋아요 성공",
    });
  } catch (error) {
    next(error);
  }
});

//토픽 좋아요 취소
router.post("/topic/like/cancel/:id", async function (req, res, next) {
  try {
    const topic_idx = parseInt(req.params.id);
    const { member_idx } = req.body;
    // const result = await client.$queryRaw(
    //   Prisma.sql`SELECT COUNT(*) AS cnt FROM write_topic_like WHERE member_idx = ${member_idx} AND topic_idx = ${topic_idx}`
    // )
    // const test = JSON.stringify(result)

    // console.log(test[8])

    const result = await client.write_topic_like.deleteMany({
      where: {
        member_idx: member_idx,
        topic_idx: topic_idx,
      },
    });

    res.status(200).json({
      success: true,
      result: result,
      msg: "토픽 좋아요 취소 성공",
    });
  } catch (error) {
    next(error);
  }
});

//스크랩 체크
router.post("/topic/scrap/:id", async function (req, res, next) {
  try {
    const { member_idx, sector } = req.body;
    const board_idx = parseInt(req.params.id);

    const result = await client.write_scrap.findMany({
      where: {
        member_idx: member_idx,
        board_idx: board_idx,
        sector: sector,
      },
    });

    res.status(200).json({
      success: true,
      result: result,
      msg: "스크랩 조회 성공",
    });
  } catch (error) {
    next(error);
  }
});

//스크랩 입력
router.post("/topic/scrap/insert/:id", async function (req, res, next) {
  try {
    const board_idx = parseInt(req.params.id);
    const { member_idx, sector } = req.body;
    const result = await client.$queryRaw(
      Prisma.sql`INSERT INTO write_scrap (member_idx, board_idx, sector) SELECT ${member_idx}, ${board_idx}, ${sector} FROM DUAL WHERE NOT EXISTS (SELECT member_idx, board_idx, sector FROM write_scrap WHERE member_idx = ${member_idx} AND board_idx = ${board_idx} AND sector = ${sector})`
    );

    res.status(200).json({
      success: true,
      result: result,
      msg: "스크랩 성공",
    });
  } catch (error) {
    next(error);
  }
});

//스크랩 취소
router.post("/topic/scrap/cancel/:id", async function (req, res, next) {
  try {
    const board_idx = parseInt(req.params.id);
    const { member_idx, sector } = req.body;

    const result = await client.write_scrap.deleteMany({
      where: {
        member_idx: member_idx,
        board_idx: board_idx,
        sector: sector,
      },
    });

    res.status(200).json({
      success: true,
      result: result,
      msg: "토픽 스크랩 취소 성공",
    });
  } catch (error) {
    next(error);
  }
});

//gcs정보 얻어오기
async function getBucketMetadata() {
  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  // The ID of your GCS bucket
  // const bucketName = 'your-unique-bucket-name';

  // Get Bucket Metadata
  const [metadata] = await storage.bucket("booster-bucket").getMetadata();

  for (const [key, value] of Object.entries(metadata)) {
    console.log(`${key}: ${value}`);
  }
}

module.exports = router;
