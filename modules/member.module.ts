const mysqlConnection = require('./db-connection');
import { transformMap } from "../util";
const bcrypt = require('bcrypt');

export class Member {
    constructor() {

    }
    getMemberIds(calback: CallableFunction):void {
        mysqlConnection.query("SELECT `flat_no`, `owner`, `password`, `user_id` FROM `member` where disabled IS NULL OR disabled!='y';", (err: any, row: any) => {

            if (!err) {
                row.map((obj: any) => {
                    obj['is_registered'] = !!obj.password;
                    delete obj.password;
                    return obj;
                });

                const map = new Map([
                    ['flat_no', 'flatNo'],
                    ['is_registered', 'isRegistered'],
                    ['user_id', 'userId'],
                    ['owner', 'owner']
                ]);
                const result = transformMap(row, map);
                calback(null, result);
            } else {
                calback(err, []);
            }
        });
    }

    getPanNumber(params: any): Promise<any> {
        return new Promise((res, rej) => {
            const { flatNo, panNo } = params;
            mysqlConnection.query("SELECT `pan` FROM `member` where `flat_no`=?",
                [flatNo], (err: any, row: any) => {
                if (!err) {
                    res({isValidPan: row[0].pan === panNo});
                } else {
                    rej(err);
                }
            });
        })
    }

    validateUser(params: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const { userId, password } = params;
            mysqlConnection.query("SELECT * FROM `member` where `user_id`=?",
                [userId], (err: any, row: any) => {
                    if (!err) {
                        const map = new Map([
                            ['flat_no', 'flatNo'],
                            ['is_registered', 'isRegistered'],
                            ['user_id', 'userId'],
                            ['password', 'password'],
                            ['type', 'type']
                        ]);
                        const result: any = transformMap(row, map);
                        const hash = result[0].password;
                        const validUser = bcrypt.compareSync(password, hash);
                        if (validUser) {
                            const {userId, flatNo, type} = result[0];
                            resolve({ userId, flatNo, type });
                        } else {
                            reject("User id or password is not correct!");
                        }
                        
                    } else {
                        reject(err);
                    }
                });
        });
    }
}