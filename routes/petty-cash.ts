import { Router, Request, Response } from "express";
import { ApiResponse } from "../modules/response.module";
import { AuthModule } from "../modules/auth.module";
import { PettyCashModule } from '../modules/petty-cash.module';

const router = Router();
const authModule = new AuthModule();

const pettyCashModule = new PettyCashModule();

router.get("/all", authModule.authenticateToken, (req: any, res: any, next: any) => {
    const flatNo = req.query.flatNo;

    pettyCashModule.getAllTransactions()
        .then((row) => {
            const apiRes = new ApiResponse(null, row);
            res.status(apiRes.statusCode).json(apiRes.data);
        }).catch((err) => {
            const apiRes = new ApiResponse(err, {});
            res.status(apiRes.statusCode).json(apiRes.data);
        });
});

router.post('/', authModule.authenticateToken, (req: any, res: any, next: any) => {
    const { userId } = req.sessionData;
    const { flatNo, creditAmount, debitAmount, description,
            transactionDate, transactionRef
        } = req.body;

    const params = {
        flatNo, userId, creditAmount, debitAmount, description,
        transactionDate, transactionRef
    };

    pettyCashModule.addTransaction(params)
        .then((row) => {
            const apiRes = new ApiResponse(null, row);
            res.status(apiRes.statusCode).json(apiRes.data);
        }).catch((err) => {
            const apiRes = new ApiResponse(err, {});
            res.status(apiRes.statusCode).json(apiRes.data);
        });
});

router.delete('/', authModule.authenticateToken, (req: any, res: any, next: any) => {
    pettyCashModule.deleteTransaction(req.body)
        .then((row) => {
            const apiRes = new ApiResponse(null, row);
            res.status(apiRes.statusCode).json(apiRes.data);
        }).catch((err) => {
            const apiRes = new ApiResponse(err, {});
            res.status(apiRes.statusCode).json(apiRes.data);
        });
});

router.get('/summary', authModule.authenticateToken, async (req: any, res: any, next: any) => {
    const summary = await pettyCashModule.getSummary();
    const apiRes = new ApiResponse(null, summary);
    res.status(apiRes.statusCode).json(apiRes.data);
});

module.exports = router;