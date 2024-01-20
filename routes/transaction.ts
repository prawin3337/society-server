const path = require('path');
import { Router, Request, Response } from "express";
import { Member } from "../modules/member.module";
import { ApiResponse } from "../modules/response.module";
import { AuthModule } from "../modules/auth.module";
import { body, header, validationResult, param } from 'express-validator';
import { TransactionModule } from "../modules/transaction.module";
import { MaintenanceModule } from "../modules/maintenance.module";

const router = Router();
const multer = require('multer');

const tranactionModule = new TransactionModule();

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

router.post('/', authModule.authenticateToken, (req: any, res: any, next: any) => {
    const upload = multer({ storage: storage }).single("photo");
    upload(req, res, (err: any) => {
        const { userId } = req.sessionData;
        const { flatNo, creditAmount, debitAmount, transactionCode, transactionDate, 
            transactionType, isCredit, description, receiptNumber } = req.body;

        if (!flatNo || (!creditAmount && !debitAmount) || !transactionCode || !transactionDate || !transactionType) {
            res.status(501).json({ err: "Please fill all requred fields." });
            return;
        } else if (err) {
            res.status(501).json({ err });
            return;
        }

        const { filename: photo } = req.file || "";
        const params = {
            flatNo, creditAmount, debitAmount, transactionCode, receiptNumber, photo,
            transactionDate, transactionType, userId, isCredit, description};

        tranactionModule.addTransaction(params)
            .then((row) => {
                const apiRes = new ApiResponse(null, row);
                res.status(apiRes.statusCode).json(apiRes.data);
            }).catch((err) => {
                const apiRes = new ApiResponse(err, {});
                res.status(apiRes.statusCode).json(apiRes.data);
            });
        
    });
});

router.get("/all", authModule.authenticateToken, (req: any, res: any, next: any) => {
    const flatNo = req.query.flatNo;
    const financYear = JSON.parse(req.query.financYear);

    tranactionModule.getTransactions(flatNo, financYear)
        .then((row) => {
            const apiRes = new ApiResponse(null, row);
            res.status(apiRes.statusCode).json(apiRes.data);
        }).catch((err) => {
            const apiRes = new ApiResponse(err, {});
            res.status(apiRes.statusCode).json(apiRes.data);
        });
});

router.post('/approve', authModule.authenticateToken, (req: any, res: any, next: any) => {
    const userType = req.sessionData.type;
    const userId = req.sessionData.userId;

    if (userType != "admin") {
        const apiRes = new ApiResponse({message: "Not a valid user to update data."}, {});
        res.status(apiRes.statusCode).json(apiRes.data);
        return;
    }

    tranactionModule.approveTransaction({ ...req.body, userId })
        .then((row) => {
            if (req.body.flatNo == "0") {
                const apiRes = new ApiResponse(null, row);
                res.status(apiRes.statusCode).json(apiRes.data);
                return;
            }

            new MaintenanceModule()
                .updateMaintenanceAmt(req.body.flatNo)
                .then(() => {
                    const apiRes = new ApiResponse(null, row);
                    res.status(apiRes.statusCode).json(apiRes.data);
                });
        }).catch((err) => {
            const apiRes = new ApiResponse(err, {});
            res.status(apiRes.statusCode).json(apiRes.data);
        });
})

module.exports = router;