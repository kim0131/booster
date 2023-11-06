import express from "express";
import { PrismaClient, Prisma, prisma } from "@prisma/client";
import { env } from "process";

const client = new PrismaClient();
const router = express.Router();
const path = require("path");
const salt = env.salt;
const sha256 = require("sha256");

router.post("/login", async (req, res, next) => {
  try {
    let { mb_id, mb_pw } = req.body;
    if (mb_pw) {
      mb_pw = await sha256(mb_pw + salt);
    }
    const loginResult = await client.member.findFirst({
      where: {
        mb_id: mb_id,
        mb_pw: mb_pw,
      },
      select: {
        mb_id: true,
        mb_pw: true,
        mb_nick: true,
        idx: true,
      },
    });

    if (loginResult == null) {
      return res.status(400).json({
        success: false,
        msg: "로그인에 실패하였습니다",
        result: loginResult,
      });
    }

    res.status(200).json({
      success: true,
      msg: "로그인 성공",
      result: loginResult,
    });
  } catch (error) {
    next(error);
  }
  //res.json(result);
});

//아이디 찾기
router.post("/find-id", async (req, res) => {
  try {
    const { mb_name, mb_ph } = req.body;

    const result = await client.member.findFirst({
      where: {
        mb_name: mb_name,
        mb_ph: mb_ph,
      },
      select: {
        mb_id: true,
        mb_datetime: true,
      },
    });

    if (result == null) {
      throw new Error("woops");
    }

    res.status(200).json({
      success: true,
      msg: "이름,전화번호 일치",
      result: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      msg: "일치하는 아이디가 없습니다",
      result: error,
    });
  }
});

//비밀번호 초기화 아이디 일치검색
router.post("/find-password", async (req, res) => {
  try {
    const { mb_id, mb_name, mb_ph } = req.body;

    const result = await client.member.findFirst({
      where: {
        mb_id: mb_id,
        mb_name: mb_name,
        mb_ph: mb_ph,
      },
      select: {
        mb_id: true,
        mb_datetime: true,
      },
    });

    if (result == null) {
      throw new Error("woops");
    }

    res.status(200).json({
      success: true,
      msg: "아이디, 이름, 전화번호 일치",
      result: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      msg: "일치하는 아이디가 없습니다",
      result: error,
    });
  }
});

//비밀번호 초기화
router.post("/reset-password", async (req, res) => {
  try {
    let { mb_id, mb_name, mb_ph, mb_pw } = req.body;
    if (mb_pw) {
      mb_pw = await sha256(mb_pw + salt);
    }
    const result = await client.member.update({
      where: {
        mb_id: mb_id,
      },
      data: {
        mb_pw: mb_pw,
      },
    });

    if (!result) {
      throw new Error("error");
    }

    res.status(200).json({
      success: true,
      msg: "비밀번호 초기화 성공",
      result: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      msg: "일치하는 아이디가 없습니다",
      result: error,
    });
  }
});

/* GET home page. */
router.get("/123", (req: express.Request, res: express.Response, next) => {
  try {
    throw new Error("Hello Error!");
  } catch (error) {
    // manually catching
    next(error); // passing to default middleware error handler
  }
});

//사업자 idx 조회
router.post("/find-idx", async (req, res) => {
  try {
    const { mb_id } = req.body;
    const result = await client.member.findFirst({
      where: {
        mb_id: mb_id,
      },
      select: {
        idx: true,
        mb_business_num: true,
      },
    });

    if (result == null) {
      throw new Error("woops");
    }

    res.status(200).json({
      success: true,
      msg: "조회완료",
      result: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      msg: "일치하는 아이디가 없습니다",
      result: error,
    });
  }
});

module.exports = router;
