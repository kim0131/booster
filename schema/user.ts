import express from "express";
import { PrismaClient, Prisma, prisma } from "@prisma/client";
import { env } from "process";

const client = new PrismaClient();
const router = express.Router();
const path = require("path");
const salt = env.salt;
const sha256 = require("sha256");


//회원 조회
router.get("/user/list", async (req, res) => {
  try {
    const result = await client.member.findMany({
      orderBy: {
        idx: "desc",
      },
    });
    const result2 = await client.$queryRaw(
      Prisma.sql`select * ,
       (select business_company from business where idx = a.mb_business_num) as business_company,
      (select business_address1 from business where idx = a.mb_business_num) as business_address1, 
      (select business_address2 from business where idx = a.mb_business_num) as business_address2,
      (select business_sector from business where idx = a.mb_business_num) as business_sector 
      from member a order by idx desc`
    );
    if (!result) {
      throw Error("error!!!");
    }
    res.status(200).json({
      success: true,
      result: result2,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      msg: "회원조회 에러",
      result: error,
    });
  }
});

//회원 상세조회
router.get("/user/:id", async (req, res, next) => {
  try {
    const idx = parseInt(req.params.id);
    const result = await client.member.findFirst({
      where: {
        idx: idx,
      },
    });
    if (!result) {
      throw Error("error!!!");
    }
    res.status(200).json({
      success: true,
      result: result,
    });
  } catch (error) {
    //next(error);
    res.status(400).json({
      success: false,
      msg: "아이디가 존재하지 않습니다",
      result: error,
    });
  }
});

//회원 수정
router.post("/user/update/:id", async (req, res, next) => {
  let {
    mb_id,
    mb_email,
    mb_name,
    mb_nick,
    mb_ph,
    mb_pw,
    mb_pw_token,
    mb_email_certify,
    mb_archive,
    mb_birth,
    mb_business_certify,
    mb_business_num,
  } = req.body;
  try {
    const idx = parseInt(req.params.id);
    if (mb_pw) {
      mb_pw = await sha256(mb_pw + salt);
    }

    const result = await client.member.update({
      where: {
        idx: idx,
      },
      data: {
        mb_id: mb_id,
        mb_email: mb_email,
        mb_name: mb_name,
        mb_nick: mb_nick,
        mb_ph: mb_ph,
        mb_pw: mb_pw,
        mb_pw_token: mb_pw_token,
        mb_email_certify: mb_email_certify,
        mb_archive: mb_archive,
        mb_birth: mb_birth,
        mb_business_certify: mb_business_certify,
        mb_business_num: mb_business_num,
      },
    });
    if (!result) {
      throw Error("error!!!");
    }
    res.status(200).json({
      success: true,
      result: result,
      msg: "회원 수정완료",
    });
  } catch (error) {
    //next(error);
    res.status(400).json({
      success: false,
      msg: "수정 오류",
      result: error,
    });
  }
});

//회원 삭제
router.post("/user/delete/:id", async (req, res, next) => {
  try {
    const idx = parseInt(req.params.id);
    const result = await client.member.delete({
      where: {
        idx: idx,
      },
    });
    if (!result) {
      throw Error("error!!!");
    }
    res.status(200).json({
      success: true,
      result: result,
      msg: "회원 삭제완료",
    });
  } catch (error) {
    //next(error);
    res.status(400).json({
      success: false,
      msg: "삭제 오류",
      result: error,
    });
  }
});

module.exports = router;
