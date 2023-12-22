import { Router, Request, Response } from "express";
import { body, validationResult } from 'express-validator';
import { ApiResponse } from "../modules/response.module";
import {Flat} from "../modules/flat.module";

const router = Router();
const flat = new Flat();

router.get("/", (req: Request, res: Response) => {
    flat.getFlatNumber((err: any, row: any) => {
        const apiRes = new ApiResponse(err, row);
        res.status(apiRes.statusCode).json(apiRes.data);
    });
});

module.exports = router;