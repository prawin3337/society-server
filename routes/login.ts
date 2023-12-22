import { Router, Request, Response } from "express";
import { body, validationResult } from 'express-validator';
import { Member } from "../modules/member.module";
import { ApiResponse } from "../modules/response.module";

const router = Router();
const member = new Member();

const { AuthModule } = require('../modules/auth.module');

const loginValidationRules = [
    body('userId').notEmpty().withMessage('User ID is required.'),
    body('password').notEmpty().withMessage('Password is required.')
];

router.post('/', loginValidationRules, (req: Request, res: Response) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    member.validateUser(req.body)
        .then((obj) => {
            const tokan = new AuthModule().generateAccessToken(obj);
            res.status(200).json({ tokan });
        })
        .catch((err) => {
            res.status(401).json({ message: err });
        });
});

const panReqValidationRules = [
    body('flatNo').notEmpty().withMessage('Flat number is required.'),
    body('panNo').notEmpty().withMessage('PAN number is required.')
];
router.post('/validate-pan', panReqValidationRules, (req: Request, res: Response) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

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