import { TransactionModule } from "./transaction.module";
const mysqlConnection = require('./db-connection');
import { transformMap, maintenanceRules } from "../util";

export class MaintenanceModule {

    private transactionModule = new TransactionModule();

    lastMaintenanceDate = new Date("dec-01-2021");

    constructor() {}

    private fetchTransactionDetails(flatNo: string) {
        return new Promise((res, rej) => {
            this.transactionModule
                .getAllTransactions(flatNo)
                .then((result: any) => {
                    res(result)
                })
                .catch((err) => {
                    console.log(err);
                    rej(err);
                });
        });
    }

    private fetchMaintenanceDetails(flatNo: string) {
        const query = "select * from maintainance_master where flat_no=?";
        const map = new Map([
            ['id', 'id'],
            ['date', 'date'],
            ['flat_no', 'flatNo'],
            ['user_id', 'userId'],
            ['penalty_id', 'penaltyId'],
            ['maintainance_amt', 'maintainanceAmt'],
            ['penalty_amt', 'penaltyAmt']
        ]);

        return new Promise((res, rej) => {
            mysqlConnection.query(query, [flatNo], (err: any, row: any) => {
                if (!err) {
                    const data = this.getMaintenanceDetails(row);
                    res(data);
                } else {
                    console.log(err);
                    rej(err);
                }
            })
        });
    }

    getMaintenanceAmt(flatNo: string) {
        return new Promise((resolve, reject) => {
            const mainAmt = maintenanceRules.maintenanceDetails.amount; //1500
            const transactionDet = this.fetchTransactionDetails(flatNo);
            const maintainanceDet = this.fetchMaintenanceDetails(flatNo);
            Promise.all([transactionDet, maintainanceDet])
                .then((data) => {
                    const transactionData: any = data[0];
                    const maintainanceDet: any = data[1];
                    console.log("transactionData= ", transactionData);
                    console.log("maintainanceDet= ", maintainanceDet);

                    const pendingMonths = maintainanceDet.pendingMonths;

                    const maintainance = pendingMonths.map((date: any) => {
                       const newRow = {
                        transactionRef: "",
                        maintainanceAmt: 0,
                        date: date
                       }

                        transactionData
                            .filter((transaction: any) => {
                                return transaction.balanceAmt && transaction.balanceAmt > 0;
                            })
                            .forEach((transaction: any) => {
                                if() {

                                }
                            });

                        return newRow;
                    });

                    resolve(maintainance);
                })
                .catch((err) => {
                    reject(err);
                });
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

    private calMaintenanceAmt(data: any[]) {

    }

    private calPenaltyAmt() {

    }
}