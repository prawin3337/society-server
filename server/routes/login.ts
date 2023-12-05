import { Router } from "express";
import { body, validationResult } from 'express-validator';

const router = Router();

const { generateAccessToken } = require('./auth');

const taskValidationRules = [
    body('id').notEmpty().withMessage('ID is required.'),
    body('password').notEmpty().withMessage('Password is required.')
];

router.post('/', taskValidationRules, (req: any, res: any) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const tokan = generateAccessToken(req.body);
    res.send({
        tokan
    });
});

module.exports = router;