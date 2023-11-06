import express from "express";
import { PrismaClient, Prisma, prisma } from "@prisma/client";
import { body, validationResult } from "express-validator";
import "dotenv/config";

const client = new PrismaClient();
const router = express.Router();

//사업자 조회
router.get("/business/list", async (req, res, next) => {
  try {
    const result = await client.business.findMany();

    res.status(200).json({
      success: true,
      result: result,
      msg: "사업자 조회 성공",
    });
  } catch (error) {
    next(error);
  }
});

//사업자 상세 조회
router.get("/business/:id", async (req, res, next) => {
  try {
    const idx = parseInt(req.params.id);
    const result = await client.business.findFirst({
      where: {
        idx: idx,
      },
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

//사업자 등록
router.post(
  "/business/write",
  //upload.any(),
  async (req, res, next) => {
    try {
      const {
        mb_idx,
        business_company,
        business_url,
        business_name,
        business_number,
        business_address1,
        business_address2,
        business_number2,
        business_sector,
        business_status,
      } = req.body;

      const errors = validationResult(req.body);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const filenames = req.files! as Array<Express.Multer.File>;
      //const file_url = filenames.map(file => file.filename)
      //const file_url = req.files.key;
      const result = await client.business.create({
        data: {
          mb_idx: parseInt(mb_idx),
          business_company: business_company,
          business_name: business_name,
          business_url: business_url,
          business_number: business_number,
          business_address1: business_address1,
          business_address2: business_address2,
          business_number2: business_number2,
          business_sector: business_sector,
          business_status: business_status,
        },
      });

      res.status(200).json({
        success: true,
        result: result,
        msg: "사업자 등록완료",
      });
    } catch (error) {
      next(error);
    }
  }
);

//사업자 수정
router.post("/business/update/:id", async (req, res, next) => {
  const {
    business_company,
    business_url,
    business_name,
    business_number,
    business_address1,
    business_address2,
    business_number2,
    business_sector,
    business_status,
    business_telephone,
  } = req.body;
  try {
    const idx = parseInt(req.params.id);
    const result = await client.business.update({
      where: {
        idx: idx,
      },
      data: {
        business_company: business_company,
        business_url: business_url,
        business_name: business_name,
        business_number: business_number,
        business_address1: business_address1,
        business_telephone: business_telephone,
        business_address2: business_address2,
        business_number2: business_number2,
        business_sector: business_sector,
        business_status: business_status,
      },
    });

    if (!result) {
      throw Error("error!!!");
    }

    res.status(200).json({
      success: true,
      result: result,
      msg: "사업자 수정완료",
    });
  } catch (error) {
    //next(error);
    res.status(400).json({
      success: false,
      msg: "사업자 수정실패",
      result: error,
    });
  }
});

//사업자 삭제
router.post("/business/delete/:id", async (req, res, next) => {
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
      msg: "사업자 삭제완료",
    });
  } catch (error) {
    //next(error);
    res.status(400).json({
      success: false,
      msg: "사업자가 존재하지 않습니다",
      result: error,
    });
  }
});

module.exports = router;
