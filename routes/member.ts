import { Router, Request, Response } from "express";
import { Member } from "../modules/member.module";
import { ApiResponse } from "../modules/response.module";

const router = Router();
const member = new Member();

router.get('/', (req: Request, res: Response) => {
    member.getMemberIds((err: any, row: any) => {
        const apiRes = new ApiResponse(err, row);
        res.status(apiRes.statusCode).json(apiRes.data);
    });
});

module.exports = router;