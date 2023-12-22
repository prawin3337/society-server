const mysqlConnection = require('./db-connection');
import { transformMap } from "../util";

export class Member {
    constructor() {

    }
    getMemberIds(calback: CallableFunction):void {
        mysqlConnection.query("SELECT `flat_no`, `password` FROM `member` where disabled IS NULL OR disabled!='y';", (err: any, row: any) => {

            if (!err) {
                row.map((obj: any) => {
                    obj.isRegistered = !!obj.password;
                    delete obj.password;
                    return obj;
                });

                const map = new Map([
                    ['flat_no', 'flatNo'],
                    ['isRegistered', 'isRegistered']
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
}