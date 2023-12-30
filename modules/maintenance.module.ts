import { TransactionModule } from "./transaction.module";
const mysqlConnection = require('./db-connection');
import { transformMap, maintenanceRules } from "../util";

export class MaintenanceModule {

    private transactionModule = new TransactionModule();

    lastMaintenanceDate = new Date("dec-01-2021");

    constructor() {}

    private fetchTotalCreditAmt(flatNo: string) {
        return new Promise((res, rej) => {
            this.transactionModule
                .getTotalCreditAmt(flatNo)
                .then((result: any) => {
                    res(result[0])
                })
                .catch((err) => {
                    console.log(err);
                    rej(err);
                });
        });
    }

    private fetchMaintenanceDetails(flatNo: string) {
        const map = new Map([
            ['id', 'id'],
            ['date', 'date'],
            ['flat_no', 'flatNo'],
            ['user_id', 'userId'],
            ['penalty_id', 'penaltyId'],
            ['maintainance_amt', 'maintainanceAmt']
        ]);

        const query = "select * from maintainance_master where flat_no=?";
        return new Promise((res, rej) => {
            mysqlConnection.query(query, [flatNo], (err: any, row: any) => {
                if (!err) {
                    const result: any = transformMap(row, map);
                    const totalMaintanceAmt = result.reduce((a: any, b: any) => a + b.maintainanceAmt, 0)
                    const data = this.getMaintenanceDetails(result);
                    res({ ...data, result, totalMaintanceAmt });
                } else {
                    console.log(err);
                    rej(err);
                }
            })
        });
    }

    private getMaintenanceDetails(data: any[]) {
        const lastMaintenance = this.getLastMaintenance(data);
        const pendingMainMonths = this.getPendingMainMonths(lastMaintenance.date);
        return pendingMainMonths;
    }

    private getLastMaintenance(data: any[]) {
        return data.reduce((prev, cur) => {
            cur = (cur.date < prev.date) ? prev : cur;
            return cur;
        }, { date: this.lastMaintenanceDate });
    }

    private getPendingMainMonths(lastMaintenanceDate: Date = this.lastMaintenanceDate) {
        const curDate = new Date();
        let months;
        months = (curDate.getFullYear() - lastMaintenanceDate.getFullYear()) * 12;
        months -= lastMaintenanceDate.getMonth() + 1;
        months += curDate.getMonth();

        if (curDate.getDate() > 15) {
            months += 1;
        }

        let monthsCount = months <= 0 ? 0 : months;
        let pendingMonths = [];

        for (let i = 1; i <= monthsCount; i++) {
            const lastMainDate = lastMaintenanceDate;
            const newDate = new Date(lastMainDate.setMonth(lastMainDate.getMonth() + 1));
            const monthlyMainDate = new Date(newDate.setDate(15));
            pendingMonths.push(monthlyMainDate);
        }

        return ({ monthsCount, pendingMonths });
    }

    getMaintenanceAmt(flatNo: string) {
        return new Promise((resolve, reject) => {
            const mainAmt = maintenanceRules.maintenanceDetails.creditAmount; // 1500
            const transactionDet = this.fetchTotalCreditAmt(flatNo);
            const maintainanceDet = this.fetchMaintenanceDetails(flatNo);

            Promise.all([transactionDet, maintainanceDet])
                .then((data) => {
                    const transactionData: any = data[0];
                    const maintainanceDet: any = data[1];

                    const { creditAmount } = transactionData;
                    const { pendingMonths, totalMaintanceAmt } = maintainanceDet;

                    let diffAmt = creditAmount - totalMaintanceAmt;

                    const maintainance = pendingMonths.map((date: any, index: number) => {
                        let maintainanceAmt = 0;
                        const penaltyAmt = maintenanceRules.latePayment.penaltyAmt;
                        let penaltyTotal = (pendingMonths.length - index) * penaltyAmt;

                        if ((mainAmt + penaltyTotal) <= diffAmt) {
                            maintainanceAmt = mainAmt;
                            diffAmt = diffAmt - (mainAmt + penaltyTotal);
                        }

                        const newRow = {
                            maintainanceAmt,
                            date: date,
                            penaltyTotal
                        }
                        return newRow;
                    })
                    .filter((maintainance: any) => maintainance.maintainanceAmt > 0);

                    resolve(maintainance);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }
}