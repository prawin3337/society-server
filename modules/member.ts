import dbConnection from "./db-connection";
import { transformMap } from "../util";

export class Member {
    constructor() {

    }

    public getMemberIds(calback: CallableFunction):void {
        dbConnection.query("SELECT `flat_no` FROM `member`;", (err: any, row: any) => {
            if (!err) {
                const map = new Map([
                    ['flat_no', 'flatNo']
                ]);
                const result = transformMap(row, map);
                calback(null, result);
            } else {
                calback(err, []);
            }
        });
    }
}