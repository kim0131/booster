import express from "express";
import { PrismaClient, Prisma, prisma } from "@prisma/client";

const client = new PrismaClient();
const router = express.Router();

router.get("/category", async (req, res, next) => {
  try {
    const { bo_table, bo_subject } = req.body;
    const result = await client.$queryRaw`
      SELECT 
      @ROWNUM := @ROWNUM +1 AS rn, TB.*
      FROM
      (SELECT
        A.idx, A.bo_table, A.gr_id, A.bo_subject, A.sector, A.priority, A.open, SUM(B.wr_good) AS wr_good, SUM(B.wr_view) AS wr_view, COUNT(B.board) AS board
      FROM board A
      LEFT JOIN write_topic B
      ON A.idx=B.board
      GROUP BY A.idx ORDER BY A.idx DESC) AS TB,
      (SELECT @ROWNUM :=0 ) rn`;
    //const boardResult = await client.$queryRaw`SELECT A.idx, COUNT(B.board), COUNT(B.wr_view) FROM board A LEFT JOIN write_topic B ON A.idx=B.board WHERE 1 GROUP BY A.idx ORDER BY COUNT(B.board)`

    res.status(200).json({
      success: true,
      result: result,
      //boardCount: boardResult,
      msg: "카테고리 조회 성공",
    });
  } catch (error) {
    next(error);
  }
});

router.get("/category/:id", async (req, res, next) => {
  try {
    const idx = parseInt(req.params.id);
    const result = await client.board.findFirst({
      where: {
        idx: idx,
      },
    });

    res.status(200).json({
      success: true,
      result: result,
      msg: "카테고리 상세조회 성공",
    });
  } catch (error) {
    next(error);
  }
});

//카테고리 중복체크
router.post("/category/check", async (req, res, next) => {
  try {
    const { bo_table } = req.body;
    const tableResult = await client.board.findFirst({
      where: {
        bo_table: bo_table,
      },
      select: {
        bo_subject: true,
      },
    });

    res.status(200).json({
      success: true,
      msg: "카테고리 사용가능합니다",
    });
  } catch (error) {
    next(error);
  }
});

router.post("/category/create", async (req, res, next) => {
  try {
    const { bo_table, bo_subject, sector, open } = req.body;
    const result = await client.board.create({
      data: {
        bo_table: bo_table,
        //gr_id: gr_id,
        bo_subject: bo_subject,
        sector: sector,
        open: open,
        priority: 0,
      },
    });
    res.status(200).json({
      success: true,
      result: result,
      msg: "카테고리 생성 성공",
    });
  } catch (error) {
    next(error);
  }
});

router.post("/category/select", async (req, res, next) => {
  try {
    const table = "board";
    console.log(table);
    const result = await client.$queryRawUnsafe(
      `SELECT * FROM booster.${table}`
    );

    res.status(200).json({
      success: true,
      result: result,
      msg: "카테고리 생성 성공",
    });
  } catch (error) {
    next(error);
  }
});

//카테고리 수정
router.post("/category/update/:id", async (req, res, next) => {
  try {
    const { bo_table, bo_subject, open, priority } = req.body;
    const idx = parseInt(req.params.id);
    const result = await client.board.update({
      where: {
        idx: idx,
      },
      data: {
        bo_table: bo_table,
        bo_subject: bo_subject,
        open: open,
        priority: priority,
      },
    });
    res.status(200).json({
      success: true,
      result: result,
      msg: "카테고리 수정완료",
    });
  } catch (error) {
    next(error);
  }
});

//카테고리 삭제
router.post("/category/delete/:id", async (req, res, next) => {
  try {
    const idx = parseInt(req.params.id);
    const result = await client.board.delete({
      where: {
        idx: idx,
      },
    });

    res.status(200).json({
      success: true,
      result: result,
      msg: "카테고리 삭제완료",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
