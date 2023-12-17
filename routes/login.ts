import { Router, Request, Response } from "express";
import { body, validationResult } from 'express-validator';
import { Member } from "../modules/member";
import { ApiResponse } from "../modules/response";

const router = Router();
const member = new Member();

const { generateAccessToken } = require('../modules/auth.module');

const taskValidationRules = [
    body('flatNo').notEmpty().withMessage('Flat number is required.'),
    body('password').notEmpty().withMessage('Password is required.')
];

router.post('/', taskValidationRules, (req: Request, res: Response) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const tokan = generateAccessToken(req.body);
    res.status(200).json({tokan});
});

router.get('/member-ids', (req: Request, res: Response) => {
    member.getMemberIds((err: any, row: any) => {
        const apiRes = new ApiResponse(err, row);
        res.status(apiRes.statusCode).json(apiRes.data);
    });
});

router.post('/validate-pan', (req: Request, res: Response) => {
    member.getPanNumber(req.body)
        .then((row) => {
            const apiRes = new ApiResponse(null, row);
            res.status(apiRes.statusCode).json(apiRes.data);
        })
        .catch((err) => {
            const apiRes = new ApiResponse(err, {});
            res.status(apiRes.statusCode).json(apiRes.data);
        });
});

module.exports = router;