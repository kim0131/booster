import express from "express";
import { PrismaClient, Prisma, prisma } from "@prisma/client";
import { body, validationResult } from "express-validator";
import { env } from "process";

const client = new PrismaClient();
const router = express.Router();
const path = require("path");
const salt = env.salt;
const sha256 = require("sha256");

//아이디 중복체크
router.post("/mbid-check", async (req, res, next) => {
  try {
    const { mb_id } = req.body;
    const idResult = await client.member.findUnique({
      where: {
        mb_id: mb_id,
      },
      select: {
        mb_id: true,
      },
    });

    if (idResult != null) {
      return res.status(200).json({
        success: false,
        msg: "아이디가 중복되었습니다",
        result: idResult,
      });
    }

    res.status(200).json({
      success: true,
      msg: "아이디 사용가능합니다",
    });
  } catch (error) {
    next(error);
  }
});

router.post("/mbnick-check", async (req, res, next) => {
  try {
    const { mb_nick } = req.body;
    const nickResult = await client.member.findFirst({
      where: {
        mb_nick: mb_nick,
      },
      select: {
        mb_nick: true,
      },
    });

    if (nickResult != null) {
      return res.status(200).json({
        success: false,
        msg: "닉네임이 중복되었습니다",
        result: nickResult,
      });
    }

    res.status(200).json({
      success: true,
      msg: "닉네임 사용가능합니다",
    });
  } catch (error) {
    next(error);
  }
});

router.post("/mbemail-check", async (req, res, next) => {
  try {
    const { mb_email } = req.body;
    const emailResult = await client.member.findFirst({
      where: {
        mb_email: mb_email,
      },
      select: {
        mb_email: true,
      },
    });
    if (emailResult != null) {
      return res.status(200).json({
        success: false,
        msg: "이메일이 중복되었습니다",
        result: emailResult,
      });
    }

    res.status(200).json({
      success: true,
      msg: "이메일 사용가능합니다",
    });
  } catch (error) {
    next(error);
  }
});

router.post("/mbph-check", async (req, res, next) => {
  try {
    const { mb_ph } = req.body;
    const phResult = await client.member.findFirst({
      where: {
        mb_ph: mb_ph,
      },
      select: {
        mb_ph: true,
      },
    });

    if (phResult != null) {
      return res.status(200).json({
        success: false,
        msg: "전화번호가 중복되었습니다",
        result: phResult,
      });
    }

    res.status(200).json({
      success: true,
      msg: "전화번호 사용가능합니다",
    });
  } catch (error) {
    next(error);
  }
});

// 회원가입
router.post(
  "/signup",
  async (req: express.Request, res: express.Response, next) => {
    try {
      let {
        mb_id,
        mb_pw,
        mb_email,
        mb_name,
        mb_ph,
        mb_pw_token,
        mb_business_num,
        mb_nick,
      } = req.body;
      const error = validationResult(req);
      if (mb_pw) {
        mb_pw = await sha256(mb_pw + salt);
      }

      if (!error.isEmpty()) {
        return res.status(200).json({ errors: error.array() });
      }

      const result = await client.member.create({
        data: {
          mb_id: mb_id,
          mb_pw: mb_pw,
          mb_email: mb_email,
          mb_name: mb_name,
          mb_nick: mb_nick,
          mb_ph: mb_ph,
          mb_pw_token: mb_pw_token,
          mb_business_num: mb_business_num,
        },
      });

      res.status(200).json({
        success: true,
        result: result,
        msg: "회원가입 성공",
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
