import express from "express";
import { PrismaClient, Prisma, prisma } from "@prisma/client";
import { env, nextTick } from "process";
import 'dotenv/config'
import _ from "lodash";
import nodemailer from "nodemailer";

const { format } = require('util');
const client = new PrismaClient();
const router = express.Router();

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',  
    port: 465,
    secure: true,
    requireTLS: true,
    auth: {
        user: env.user,
        pass: env.pass,
    },
    logger: true
});

router.post("/mail-send", async function (req, res, next) {
    const { from, to, subject, text } = req.body;
    try {
        const info = await transporter.sendMail({
            from: from,
            to: to,
            subject: subject,
            text: text,
            //html: "<strong>Hello world?</strong>",
            headers: { 'x-myheader': 'test header' }
        });

        res.status(200).json({
            success: true,
            result: info.response,
            msg: "메일 전송 성공",
        });
    } catch (err) {
        next(err)
    }
})

module.exports = router;
