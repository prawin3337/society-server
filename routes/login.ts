import { Router, Request, Response } from "express";
import { body, validationResult } from 'express-validator';
import { Member } from "../modules/member";

const router = Router();

const { generateAccessToken } = require('../modules/auth.module');

const taskValidationRules = [
    body('id').notEmpty().withMessage('ID is required.'),
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
    let member = new Member();
    member.getMemberIds((err: any, row: any) => {
        if (!err) {
            res.status(200).json({
                success: true,
                data: row
            });
        } else {
            res.status(500).json({
                success: false,
                data: err
            });
        }
    });
});

module.exports = router;