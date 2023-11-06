import express from "express";
import { PrismaClient, Prisma, prisma } from "@prisma/client";
import { body, validationResult } from "express-validator";
import { writeSchema } from '../schema/write-schema'

const client = new PrismaClient();
const router = express.Router();

//게시글 조회
router.get("/notice/list", async (req, res, next) => {
  try {
    const result = await client.write_notice.findMany();
    res.status(200).json(result);
  } catch (error) {
      next(error)
  }
});

//게시글 상세 조회
router.get("/notice/list/:id", async (req, res) => {
  const idx = parseInt(req.params.id)
  const result = await client.write_notice.findFirst({
    where : {
      idx : idx
    }
  });
  res.status(200).json(result);
});

//게시글 등록
router.post("/notice/write",
writeSchema,
async (req, res) => {
  const { wr_subject, wr_content, wr_ip, mb_name, mb_email, mb_id } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
  }
  
  const result = await client.write_notice.create({
    data: {
      wr_subject : wr_subject,
      wr_content : wr_content,
      wr_ip : parseInt(wr_ip),
      mb_id : mb_id,
      mb_name : mb_name,
      mb_email : mb_email
    },
  })


  res.status(200).json({
    success: true,
    result: result,
    msg: "게시글 등록완료",
  });  
});

//게시글 수정
router.post("/notice/update/:id", async (req, res) => {
  const { wr_subject, wr_content } = req.body;
  const idx = parseInt(req.params.id)
  const result = await client.write_notice.update({
    where: {
      idx : idx
    },
    data: {
      wr_subject : wr_subject,
      wr_content : wr_content
    }    
  })
  res.status(200).json({
    success: true,
    result: result,
    msg: "게시글 수정완료",
  });
})

//게시글 삭제
router.post("/notice/delete/:id", async (req, res) => {
  const idx = parseInt(req.params.id)
  const result = await client.write_notice.delete({
    where : {
      idx : idx
    }
  })

  res.status(200).json({
    success: true,
    result: result,
    msg: "게시글 삭제완료",
  });  

})

module.exports = router;