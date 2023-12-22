const mysqlConnection = require('./db-connection');
import { transformMap } from "../util";

export class Flat {
    constructor() {

    }
    getFlatNumber(calback: CallableFunction): void {
        mysqlConnection.query("SELECT `flat_no` FROM `flat_master`;", (err: any, row: any) => {

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