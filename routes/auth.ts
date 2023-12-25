import { Router, Request, Response } from "express";
import { body, header, validationResult } from 'express-validator';
import { ApiResponse } from "../modules/response.module";
import { AuthModule } from "../modules/auth.module";
import { Member } from "../modules/member.module";

const router = Router();

const authModule = new AuthModule();

const taskValidationRules = [
    // body('id').notEmpty().withMessage('ID is required.'),
    // body('password').notEmpty().withMessage('Password is required.')
    header('Authorization').notEmpty().withMessage('Authentication is missing.')
];

router.post('/', taskValidationRules, authModule.authenticateToken, (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    res.status(200).json({ success: true });
});

const passwordUpdateRules = [
    body('flatNo').notEmpty().withMessage('Flat number is required.'),
    body('panNo').notEmpty().withMessage('PAN number is required.'),
    body('password').notEmpty().withMessage('Password is required.')
]
router.patch('/update-password', passwordUpdateRules, (req: Request, res: Response) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { flatNo, panNo, password } = req.body;
    
    new Member().getPanNumber({ flatNo, panNo })
        .then(({ isValidPan }) => {
            if (isValidPan) {
                authModule.updatePassword({flatNo, password})
                    .then((data) => {
                        const apiRes = new ApiResponse(null, data);
                        res.status(apiRes.statusCode).json(apiRes.data);
                    });
            } else {
                const apiRes = new ApiResponse("Invalid PAN number.", null);
                res.status(apiRes.statusCode).json(apiRes.data);
            }
        })
        .catch((err) => {
            const apiRes = new ApiResponse(err, {});
            res.status(apiRes.statusCode).json(apiRes.data);
        });
})

module.exports = router;