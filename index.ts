import express from "express";
// PrismaClient 가져오기 위한 모듈 불러오기
import { PrismaClient, Prisma, prisma } from "@prisma/client";
import { body, validationResult } from "express-validator";
import { env } from "process";
const check_key = env.check_key;
const client = new PrismaClient();
const bodyParser = require("body-parser");
const port = "3001";
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const fs = require("fs");

//라우팅 모듈 선언
const homeRouter = require("./routes/home.ts");
const loginRouter = require("./routes/login.ts");
const signupRouter = require("./routes/signup.ts");
const noticeRouter = require("./routes/notice.ts");
const adminRouter = require("./routes/admin.ts");
const topicRouter = require("./routes/topic.ts");
const insightRouter = require("./routes/insight.ts");
const userRouter = require("./routes/user.ts");
const uploadRouter = require("./routes/upload.ts");
const businessRouter = require("./routes/business.ts");
const mailRouter = require("./routes/mail.ts");
const certificationRouter = require("./routes/certification.ts");

class App {
  public application: express.Application;
  constructor() {
    this.application = express();
  }
}
const app = new App().application;

app.use(bodyParser.urlencoded({ extended: true }));
// parse application/json
app.use(bodyParser.json());

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      //console.log(path.extname(file.originalname))
      cb(null, "uploads/");
      // if() {
      //   cb(null, 'uploads/images');
      // } else if() {
      //   cb(null, 'uploads/texts');
      // }
    },

    filename: (req, file, cb) => {
      cb(null, new Date().valueOf() + path.extname(file.originalname));
    },
  }),
});

app.use("/uploads", express.static("uploads"));
//router
app.use("/api2", homeRouter);
app.use("/api2", loginRouter);
app.use("/api2", signupRouter);
app.use("/api2", noticeRouter, topicRouter, insightRouter);
app.use("/api2", adminRouter);
app.use("/api2", userRouter);
app.use("/api2", businessRouter);
app.use("/api2", uploadRouter);
app.use("/api2", mailRouter);
app.use("/api3", certificationRouter);

// 404 Error Handling
app.use(function (req, res, next) {
  console.log(req.body);
  res.status(404).send("page not found");
  next(new Error("없는 경로입니다."));
});

app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).send(err.stack);
});

//서버 종류 숨기기
app.disable("x-powered-by");

app.use(cors);

//데이터베이스 수정시 명령어 npx prisma db push // DB정보 푸시 (기존정보 삭제)
//prisma 새로고침 npx prisma generate
//prisma db에서 가져오기 명령어 npx prisma introspect
//port 주소
//실행 npm start

const requestIp = require("request-ip");
// inside middleware handler
const ipMiddleware = function (req, res, next) {
  const clientIp = requestIp.getClientIp(req);
  next();
};
// on localhost you'll see 127.0.0.1 if you're using IPv4
// or ::1, ::ffff:127.0.0.1 if you're using IPv6
//테스트

app.listen(port, () => {
  console.log("port :" + port + "//Start");
});
