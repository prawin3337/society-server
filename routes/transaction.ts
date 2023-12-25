const path = require('path');
import { Router, Request, Response } from "express";
import { Member } from "../modules/member.module";
import { ApiResponse } from "../modules/response.module";
import { AuthModule } from "../modules/auth.module";
import { body, header, validationResult, param } from 'express-validator';

const router = Router();
const multer = require('multer');

const authModule = new AuthModule();

const storage = multer.diskStorage({
    destination: (req: any, file: any, cb: any) => {
        cb(null, path.join(__dirname, "../public/upload_images"));
    },
    filename: function (req: any, file: any, cb: any) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const dotIndex = file.originalname.lastIndexOf(".");
        const fileExtension = file.originalname.substring(dotIndex, file.originalname.length);
        cb(null, "upload" + file.fieldname + '-' + uniqueSuffix + '' + fileExtension)
    }
})

const upload = multer({ storage: storage }).single("photo");

const taskValidationRules = [
    body('amount').notEmpty().withMessage('Amount is required.'),
    body('transactionCode').notEmpty().withMessage('Transaction No is required.'),
    body('receiptNumber').notEmpty().withMessage('receiptNumber No is required.')
];
router.post('/', authModule.authenticateToken, taskValidationRules, (req: any, res: any, next: any) => {
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //     return res.status(400).json({ errors: errors.array() });
    // }

    upload(req, res, (err: any) => {
        if (err) {
            res.status(501).json({ err });
        }
        console.log(req.body);
        console.log(req.file);
        res.send({});
    });
});

module.exports = router;