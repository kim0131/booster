import express from "express";
import { PrismaClient, Prisma, prisma } from "@prisma/client";
import { body, validationResult } from "express-validator";
import { writeSchema } from "../schema/write-schema";
import "dotenv/config";
import _ from "lodash";

const client = new PrismaClient();
const router = express.Router();

//메인 이미지 조회
router.get("/home/main", async (req, res, next) => {
  try {
    const result = await client.$queryRaw`
      SELECT idx, title, subtitle, posting_date, posting_exitdate, image_url, background_color, url, priority, open_tool
        FROM main_image`;

    res.status(200).json({
      success: true,
      result: result,
      msg: "메인이미지 조회 성공",
    });
  } catch (error) {
    next(error);
  }
});

//메인이미지 상세 조회
router.get("/home/main/detail/:id", async (req, res, next) => {
  try {
    const idx = parseInt(req.params.id);

    const result = await client.main_image.findFirst({
      where: {
        idx: idx,
      },
    });
    res.status(200).json({
      success: true,
      result: result,
      msg: "메인이미지 상세 조회 성공",
    });
  } catch (error) {
    next(error);
  }
});

//메인이미지 등록
router.post("/home/main/write", writeSchema, async (req, res, next) => {
  console.log(req.body);
  try {
    const {
      title,
      subtitle,
      posting_date,
      posting_exitdate,
      image_url,
      background_color,
      url,
      priority,
      open_tool,
    } = req.body;
    const errors = validationResult(req.body);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    console.log(errors);
    // const filenames = req.file.key;
    const result = await client.main_image.create({
      data: {
        title: title,
        subtitle: subtitle,
        posting_date: posting_date,
        posting_exitdate: posting_exitdate,
        image_url: image_url,
        background_color: background_color,
        url: url,
        priority: priority,
        open_tool: open_tool,
        //file_url: JSON.stringify(file_url)
      },
    });

    res.status(200).json({
      success: true,
      result: result,
      msg: "메인이미지 등록완료",
    });
  } catch (error) {
    next(error);
  }
});

//메인이미지 수정
router.post("/home/main/update/:id", async (req, res, next) => {
  try {
    const offset = new Date().getTimezoneOffset() * 60000;
    const today = new Date(Date.now() - offset);

    const {
      title,
      subtitle,
      posting_date,
      posting_exitdate,
      image_url,
      background_color,
      url,
      priority,
      open_tool,
    } = req.body;
    const idx = parseInt(req.params.id);
    // const filenames = req.files! as Array<Express.Multer.File>
    // const file_url = filenames.map(file => file.filename)
    const result = await client.main_image.update({
      where: {
        idx: idx,
      },
      data: {
        title: title,
        subtitle: subtitle,
        posting_date: posting_date,
        posting_exitdate: posting_exitdate,
        image_url: image_url,
        background_color: background_color,
        url: url,
        priority: priority,
        open_tool: open_tool,
      },
    });
    res.status(200).json({
      success: true,
      result: result,
      msg: "메인이미지 수정완료",
    });
  } catch (error) {
    next(error);
  }
});

//메인이미지 삭제
router.post("/home/main/delete/:id", async (req, res, next) => {
  try {
    const idx = parseInt(req.params.id);
    const result = await client.main_image.delete({
      where: {
        idx: idx,
      },
    });

    res.status(200).json({
      success: true,
      result: result,
      msg: "메인이미지 삭제완료",
    });
  } catch (error) {
    next(error);
  }
});

//광고 배너 조회
router.get("/home/adbanner", async (req, res, next) => {
  try {
    const result = await client.$queryRaw`
      SELECT idx, title, posting_date, posting_exitdate, image_url, background_color, url, priority, open_tool
        FROM ad_banner`;

    res.status(200).json({
      success: true,
      result: result,
      msg: "광고배너 조회 성공",
    });
  } catch (error) {
    next(error);
  }
});

//광고배너 상세 조회
router.get("/home/adbanner/detail/:id", async (req, res, next) => {
  try {
    const idx = parseInt(req.params.id);

    const result = await client.ad_banner.findFirst({
      where: {
        idx: idx,
      },
    });
    res.status(200).json({
      success: true,
      result: result,
      msg: "광고배너 상세 조회 성공",
    });
  } catch (error) {
    next(error);
  }
});

//광고배너 등록
router.post("/home/adbanner/write", writeSchema, async (req, res, next) => {
  console.log(req.body);
  try {
    const {
      title,
      posting_date,
      posting_exitdate,
      image_url,
      background_color,
      url,
      priority,
      open_tool,
    } = req.body;
    const errors = validationResult(req.body);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    console.log(errors);
    const result = await client.ad_banner.create({
      data: {
        title: title,
        posting_date: posting_date,
        posting_exitdate: posting_exitdate,
        image_url: image_url,
        background_color: background_color,
        url: url,
        priority: priority,
        open_tool: open_tool,
      },
    });

    res.status(200).json({
      success: true,
      result: result,
      msg: "광고배너 등록완료",
    });
  } catch (error) {
    next(error);
  }
});

//광고배너 수정
router.post("/home/adbanner/update/:id", async (req, res, next) => {
  try {
    const offset = new Date().getTimezoneOffset() * 60000;
    const today = new Date(Date.now() - offset);

    const {
      title,
      posting_date,
      posting_exitdate,
      image_url,
      background_color,
      url,
      priority,
      open_tool,
    } = req.body;
    const idx = parseInt(req.params.id);
    const result = await client.ad_banner.update({
      where: {
        idx: idx,
      },
      data: {
        title: title,
        posting_date: posting_date,
        posting_exitdate: posting_exitdate,
        image_url: image_url,
        background_color: background_color,
        url: url,
        priority: priority,
        open_tool: open_tool,
      },
    });
    res.status(200).json({
      success: true,
      result: result,
      msg: "광고배너 수정완료",
    });
  } catch (error) {
    next(error);
  }
});

//광고배너 삭제
router.post("/home/adbanner/delete/:id", async (req, res, next) => {
  try {
    const idx = parseInt(req.params.id);
    const result = await client.ad_banner.delete({
      where: {
        idx: idx,
      },
    });

    res.status(200).json({
      success: true,
      result: result,
      msg: "광고배너 삭제완료",
    });
  } catch (error) {
    next(error);
  }
});

//전체 검색
router.post("/home/search", async (req, res, next) => {
  try {
    const { search_value, board_type, bo_table, member_idx } = req.body;
    var category = ``;

    if (bo_table) {
      var category = `AND b.bo_table = '${bo_table}'`;
    }

    const sql = `SELECT idx, wr_subject, wr_content, mb_name, board, ('write_topic') AS table_name FROM write_topicWHERE wr_subject LIKE %${search_value}% AND wr_content LIKE %${search_value}%`;

    const insightSql = `SELECT idx, wr_subject, wr_content, mb_name, board, ('write_insight') FROM write_insight WHERE wr_subject LIKE %${search_value}% AND wr_content LIKE %${search_value}%`;
    var test = "";
    if (search_value) {
      const result = await client.$queryRawUnsafe(`
        SELECT
          a.idx, wr_subject, wr_content, mb_name,wr_datetime, board, ('write_topic') AS table_name,
          (SELECT COUNT(*) FROM write_topic WHERE wr_content LIKE '%${search_value}%' OR wr_subject LIKE '%${search_value}%') AS totalCnt,
          (SELECT COUNT(*) FROM write_topic WHERE wr_parent = a.idx) AS commentCnt,
          (SELECT COUNT(*) FROM write_topic_like WHERE topic_idx = a.idx) AS likeCnt,
          (SELECT IFNULL(NULL, 'Y') AS Y FROM write_scrap WHERE board_idx = a.idx AND sector = 'topic' AND member_idx = '${member_idx}') AS scrap,
          (SELECT mb_nick FROM member WHERE mb_id = a.mb_id) AS mb_nick,
          (SELECT COUNT(*) FROM write_topic a
          LEFT JOIN board b on a.board = b.idx WHERE wr_content LIKE '%${search_value}%' OR wr_subject LIKE '%${search_value}%' ${category}) AS categoryCnt,
          b.idx AS board_idx,
          b.bo_subject,
          b.bo_table
        FROM write_topic a
        LEFT JOIN board b on a.board = b.idx
        WHERE wr_content LIKE '%${search_value}%' OR wr_subject LIKE '%${search_value}%' ${category}
    
      `);

      const topicCnt = await client.$queryRawUnsafe(`
        SELECT *,(SELECT COUNT(*) FROM write_topic B WHERE A.idx=B.board AND (B.wr_subject LIKE '%${search_value}%' OR B.wr_content LIKE '%${search_value}%')) AS toCnt FROM board A WHERE sector = 'topic'
      `);

      const insightResult = await client.$queryRawUnsafe(`
        SELECT
          a.idx, wr_subject, wr_content, mb_name,wr_datetime, board, ('write_insight') AS table_name,
          (SELECT COUNT(*) FROM write_insight WHERE wr_content LIKE '%${search_value}%' OR wr_subject LIKE '%${search_value}%') AS totalCnt,
          (SELECT COUNT(*) FROM write_insight WHERE wr_parent = a.idx) AS commentCnt,
          (SELECT COUNT(*) FROM write_insight_like WHERE insight_idx = a.idx) AS likeCnt,
          (SELECT mb_nick FROM member WHERE mb_id = a.mb_id) AS mb_nick,
          (SELECT IFNULL(NULL, 'Y') AS Y FROM write_scrap WHERE board_idx = a.idx AND sector = 'insight' AND member_idx = '${member_idx}') AS scrap,
          (SELECT COUNT(*) FROM write_insight a
          LEFT JOIN board b on a.board = b.idx WHERE wr_content LIKE '%${search_value}%' OR wr_subject LIKE '%${search_value}%' ${category}) AS categoryCnt,
          b.idx AS board_idx,
          b.bo_subject,
          b.bo_table
        FROM write_insight a
        LEFT JOIN board b on a.board = b.idx
        WHERE wr_subject LIKE '%${search_value}%' OR wr_content LIKE '%${search_value}%' ${category}
      `);

      const insightCnt = await client.$queryRawUnsafe(`
        SELECT *,(SELECT COUNT(*) FROM write_insight B WHERE A.idx=B.board AND (B.wr_subject LIKE '%${search_value}%' OR B.wr_content LIKE '%${search_value}%')) AS inCnt FROM board A WHERE sector = 'insight'
      `);

      res.status(200).json({
        success: true,
        result: result,
        topicCnt: topicCnt,
        insightCnt: insightCnt,
        insightResult: insightResult,
        msg: "전체 검색 성공",
      });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
