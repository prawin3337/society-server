import { NextFunction, Request, Response } from "express";
import { DbConnect } from "./db-connection";
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

export class AuthModule {

    dbConnect: DbConnect;

    constructor() {
        this.dbConnect = new DbConnect();
    }

    generateAccessToken(props: any) { // TODO: add interface
        return jwt.sign(props, process.env.TOKEN_SECRET, { expiresIn: '8h' });
    }

    authenticateToken(req: Request, res: Response, next: NextFunction)  {
        const authHeader = req.headers['authorization'];
        const token = authHeader; //authHeader && authHeader.split(' ')[1]

        if (token == null) return res.sendStatus(401)

        jwt.verify(token, process.env.TOKEN_SECRET, (err: any, user: any) => { //TODO: add interface

            if (err) return res.status(403).json({ success: false, error: err.message });

            // req.user = user

            next()
        })
    }

    updatePassword(params: any) {
        return new Promise((res, rej) => { 
            const { flatNo, password } = params;
            const saltRounds = Number(process.env.SALT_ROUNDS);

            bcrypt.hash(password, saltRounds, (err: any, hash: string) => {

                if (err) {
                    console.log(err);
                    rej(err);
                }

                this.dbConnect.connect.query("update `member` set `password`=? where `flat_no`=?",
                    [hash, flatNo], (err: any, row: any) => {
                        if (!err) {
                            res({ message: "Password updated." });
                        } else {
                            console.log(err);
                            rej(err);
                        }
                    });
            });
        });
    }
}