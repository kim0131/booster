import express from "express";
import { PrismaClient, Prisma, prisma } from "@prisma/client";
import { body, validationResult } from "express-validator";
import { writeSchema } from "../schema/write-schema";

const client = new PrismaClient();
const router = express.Router();

//인사이트 조회
router.get("/insight/list", async (req, res, next) => {
  try {
    const result = await client.$queryRaw`
      SELECT 
            @ROWNUM := @ROWNUM +1 AS rn, TB.*
      FROM
          (SELECT *,
          (SELECT COUNT(*) FROM write_insight WHERE wr_parent = A.idx) AS commentCnt,
          (SELECT bo_subject FROM board WHERE idx = A.board AND sector = "insight") AS board_name,
          (SELECT bo_table FROM board WHERE idx = A.board AND sector = "insight") AS board_table,
          (SELECT mb_nick FROM member WHERE mb_id = A.mb_id) AS mb_nick,
          (SELECT COUNT(*) FROM write_insight_like WHERE insight_idx = A.idx) AS likeCnt
            FROM write_insight A where wr_parent is null ORDER BY idx DESC) AS TB,
          (SELECT @ROWNUM :=0 ) rn`;
    const countResult = await client.write_insight.aggregate({
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
      msg: "인사이트 조회완료",
    });
  } catch (error) {
    next(error);
  }
});

//인사이트 상세 조회
router.post("/insight/list/:id", async (req, res, next) => {
  try {
    const { member_idx, sector } = req.body;
    const idx = parseInt(req.params.id);

    if (idx) {
      if (req.cookies.viewCheck != idx) {
        res.cookie("viewCheck", idx, {
          expires: new Date(Date.now() + 86400000),
          httpOnly: true,
        });
        const view = await client.write_insight.update({
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
      Prisma.sql`SELECT *,(SELECT COUNT(*) FROM write_insight WHERE wr_parent = ${idx}) AS commentCnt,
      (SELECT bo_subject FROM board WHERE idx = A.board AND sector = "insight") AS board_name,
      (SELECT bo_table FROM board WHERE idx = A.board AND sector = "insight") AS board_table,   
      (SELECT mb_nick FROM member WHERE mb_id = A.mb_id) AS mb_nick,
      (SELECT IFNULL(NULL, 'Y') AS Y FROM write_scrap WHERE board_idx = ${idx} AND sector = ${sector} AND member_idx = ${member_idx}) AS scrap,
       (SELECT COUNT(*) FROM write_insight_like WHERE insight_idx = ${idx}) AS likeCnt
        FROM write_insight A WHERE idx = ${idx}`
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

//인사이트 댓글 카운트
router.get("/insight/commentcount/:id", async (req, res, next) => {
  try {
    const idx = parseInt(req.params.id);
    const result = await client.write_insight.findMany({
      where: {
        wr_parent: idx,
      },
    });
    res.status(200).json({
      success: true,
      result: result,
      msg: "인사이트 상세조회완료",
    });
  } catch (error) {
    next(error);
  }
});

//인사이트 대댓글 카운트
router.get("/insight/replycount/:id", async (req, res, next) => {
  try {
    const idx = parseInt(req.params.id);
    const result = await client.write_insight.findMany({
      where: {
        wr_parent2: idx,
      },
    });
    res.status(200).json({
      success: true,
      result: result,
      msg: "인사이트 상세조회완료",
    });
  } catch (error) {
    next(error);
  }
});

//인사이트 댓글 조회
router.get("/insight/comment/:id", async (req, res, next) => {
  try {
    const idx = parseInt(req.params.id);
    // const result = await client.$queryRaw(
    //   Prisma.sql`select *, (select count(*) from write_insight_like where insight_idx = a.idx) as likeCnt from write_insight a where wr_parent = ${idx} and wr_is_comment = 1`
    // );
    const result = await client.$queryRaw(
      Prisma.sql`select *,(select count(*) from write_insight_like where insight_idx = a.idx) as likeCnt, (select count(*)-1 from write_insight where wr_parent2 = a.idx) as replyCnt,ifnull(wr_parent2, a.idx) as wr_parent2 from write_insight a where wr_parent = ${idx} order by wr_parent2`
    );
    res.status(200).json({
      success: true,
      result: result,
      msg: "인사이트 상세조회완료",
    });
  } catch (error) {
    next(error);
  }
});

//인사이트 대댓글 조회
router.get("/insight/reply/:id", async (req, res, next) => {
  try {
    const idx = parseInt(req.params.id);
    const result = await client.$queryRaw(
      Prisma.sql`select *, (select count(*) from write_insight_like where insight_idx = a.idx) as likeCnt from write_insight a where wr_parent2 = ${idx} and wr_is_comment2 = 1`
    );
    res.status(200).json({
      success: true,
      result: result,
      msg: "인사이트 상세조회완료",
    });
  } catch (error) {
    next(error);
  }
});

//인사이트 등록
router.post("/insight/write", writeSchema, async (req, res, next) => {
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
    // const filenames = req.files! as Array<Express.Multer.File>
    // //const file_url = filenames.map(file => file.filename)
    // const file_url = req.files.key;
    const result = await client.write_insight.create({
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
      msg: "인사이트 등록완료",
    });
  } catch (error) {
    next(error);
  }
});
//인사이트 수정
router.post("/insight/update/:id", async (req, res, next) => {
  try {
    const { wr_subject, wr_content, board } = req.body;
    const idx = parseInt(req.params.id);
    const result = await client.write_insight.update({
      where: {
        idx: idx,
      },
      data: {
        wr_subject: wr_subject,
        wr_content: wr_content,
        board: board,
      },
    });
    res.status(200).json({
      success: true,
      result: result,
      msg: "인사이트 수정완료",
    });
  } catch (error) {
    next(error);
  }
});

//인사이트 삭제
router.post("/insight/delete/:id", async (req, res, next) => {
  try {
    const idx = parseInt(req.params.id);
    const result = await client.write_insight.delete({
      where: {
        idx: idx,
      },
    });

    res.status(200).json({
      success: true,
      result: result,
      msg: "인사이트 삭제완료",
    });
  } catch (error) {
    next(error);
  }
});

//인사이트 좋아요 조회
router.post("/insight/like/:id", async function (req, res, next) {
  try {
    const { member_idx } = req.body;
    const insight_idx = parseInt(req.params.id);

    const result = await client.write_insight_like.findMany({
      where: {
        member_idx: parseInt(member_idx),
        insight_idx: insight_idx,
      },
    });

    res.status(200).json({
      success: true,
      result: result,
      msg: "인사이트 좋아요 조회 성공",
    });
  } catch (error) {
    next(error);
  }
});

//인사이트 좋아요 입력
router.post("/insight/like/insert/:id", async function (req, res, next) {
  try {
    const insight_idx = parseInt(req.params.id);
    const { member_idx } = req.body;
    const result = await client.$queryRaw(
      Prisma.sql`INSERT INTO write_insight_like (member_idx, insight_idx) SELECT ${member_idx}, ${insight_idx} FROM DUAL WHERE NOT EXISTS (SELECT member_idx, insight_idx FROM write_insight_like WHERE member_idx = ${member_idx} AND insight_idx = ${insight_idx})`
    );

    res.status(200).json({
      success: true,
      result: result,
      msg: "인사이트 좋아요 성공",
    });
  } catch (error) {
    next(error);
  }
});

//인사이트 좋아요 취소
router.post("/insight/like/cancel/:id", async function (req, res, next) {
  try {
    const insight_idx = parseInt(req.params.id);
    const { member_idx } = req.body;

    const result = await client.write_insight_like.deleteMany({
      where: {
        member_idx: parseInt(member_idx),
        insight_idx: insight_idx,
      },
    });

    res.status(200).json({
      success: true,
      result: result,
      msg: "인사이트 좋아요 취소 성공",
    });
  } catch (error) {
    next(error);
  }
});

//스크랩 체크
router.post("/insight/scrap/:id", async function (req, res, next) {
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
router.post("/insight/scrap/insert/:id", async function (req, res, next) {
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
router.post("/insight/scrap/cancel/:id", async function (req, res, next) {
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
      msg: "스크랩 취소 성공",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
