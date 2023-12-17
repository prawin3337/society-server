import { DbConnect } from "./db-connection";
import { transformMap } from "../util";

export class Member {
    DbConnect = new DbConnect();
    constructor() {

    }
    getMemberIds(calback: CallableFunction):void {
        this.DbConnect.connect.query("SELECT `flat_no`, `password` FROM `member`;", (err: any, row: any) => {

            row.map((obj:any) => {
                obj.isRegistered = !!obj.password;
                delete obj.password;
                return obj;
            });

            if (!err) {
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
            this.DbConnect.connect.query("SELECT `pan` FROM `member` where `flat_no`=?",
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