import { NextFunction, Request, Response } from "express";

const jwt = require('jsonwebtoken');

process.env.TOKEN_SECRET;

module.exports = {
    generateAccessToken: (props: any) => { // TODO: add interface
        return jwt.sign(props, process.env.TOKEN_SECRET, { expiresIn: '8h' });
    },
    authenticateToken: (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader; //authHeader && authHeader.split(' ')[1]

        if (token == null) return res.sendStatus(401)

        jwt.verify(token, process.env.TOKEN_SECRET, (err: any, user: any) => { //TODO: add interface

            if (err) return res.status(403).json({ success: false, error: err.message });

            // req.user = user

            next()
        })
    }
}