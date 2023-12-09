import { NextFunction, Router, Request, Response } from "express";
import { body, header, validationResult } from 'express-validator';

const router = Router();

const { authenticateToken } = require('../modules/auth.module');

const taskValidationRules = [
    // body('id').notEmpty().withMessage('ID is required.'),
    // body('password').notEmpty().withMessage('Password is required.')
    header('Authorization').notEmpty().withMessage('Authentication is missing.')
];

router.post('/', taskValidationRules, authenticateToken, (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    res.status(200).json({ success: true });
});

module.exports = router;