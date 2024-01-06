import { TransactionModule } from "./transaction.module";
const mysqlConnection = require('./db-connection');
import { transformMap, maintenanceRules, transformDate } from "../util";

export class MaintenanceModule {

    private transactionModule = new TransactionModule();

    lastMaintenanceDate = new Date("dec-01-2021"); // Default maintainance start date.

    constructor() {}

    private fetchTotalCreditAmt(flatNo: string) {
        return new Promise((res, rej) => {
            this.transactionModule
                .getTotalValidCredAmt(flatNo)
                .then((result: any) => {
                    res(result[0])
                })
                .catch((err) => {
                    console.log(err);
                    rej(err);
                });
        });
    }

    private fetchAllTransactions(flatNo: string) {
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
        const map = new Map([
            ['id', 'id'],
            ['date', 'date'],
            ['flat_no', 'flatNo'],
            ['maintainance_amt', 'maintainanceAmt']
        ]);

        const query = "select id, DATE_FORMAT(date, '%Y-%m-%d') AS date,flat_no,maintainance_amt from maintainance_master where flat_no=?";
        return new Promise((res, rej) => {
            mysqlConnection.query(query, [flatNo], (err: any, row: any) => {
                if (!err) {
                    const result: any = transformMap(row, map);
                    const totalMaintanceAmt = result.reduce((a: any, b: any) => a + b.maintainanceAmt, 0);
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
        // console.log("obj= lastMaintenance", lastMaintenance);
        const lMDate = new Date(lastMaintenance.date);
        const pendingMainMonths = this.getPendingMainMonths(lMDate);
        return pendingMainMonths;
    }

    private getLastMaintenance(data: any[]) {
        return data.reduce((prev, cur) => {
            cur = (cur.date < prev.date) ? prev : cur;
            return cur;
        }, { date: this.lastMaintenanceDate });
    }

    private getPendingMainMonths(lastMaintenanceDate: Date = this.lastMaintenanceDate) {
        // console.log("obj= lastMaintenanceDate", lastMaintenanceDate);
        const curDate = new Date();
        let months = (curDate.getFullYear() - lastMaintenanceDate.getFullYear()) * 12;
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

    private deleteZeroMaintenance(flatNo: string) {
        return new Promise((res, rej) => {
            const query = "delete from maintainance_master where maintainance_amt=0 and flat_no=?";
            mysqlConnection.query(query, [flatNo], (err: any, row: any) => {
                if (!err) {
                    res(row);
                } else {
                    console.log(err);
                    rej(err);
                }
            })
        });
    }

    private getNoPenaltyAmt(pendingMonDate: any, allTransactions: any, tempMaintAmt: number) {
        const newTransactions = allTransactions;

        const { ruleDate, latePayDate } = maintenanceRules.latePayment;
        const validTrans = newTransactions.filter((obj: any) => obj.isApproved == 'y');

        const noPenaltyMon = validTrans.filter((obj: any) => {
            const tranDate = new Date(obj.transactionDate);
            let noPen = false;

            console.log("trans=", obj);
            console.log("tempMaintAmt=", tempMaintAmt);
            console.log("=================================");

            if ((tranDate.getTime() < ruleDate.getTime())) {
                noPen = true;
                return noPen;
            }

            if (tranDate.getTime() < pendingMonDate.getTime()) {
                noPen = true;
            }

            return noPen;
        });

        const noPenaltyAmt = noPenaltyMon
            .reduce((prevTran: any, curTran: any) => {
                return (prevTran + Number(curTran.creditAmount))
            }, 0);

        return (noPenaltyAmt);
    }

    private precessMaintenance(flatNo: string) {
        return new Promise((resolve, reject) => {
            this.deleteZeroMaintenance(flatNo)
                .then((deleteRec) => {
                    // console.log("Deleted zero maintenace records:", deleteRec);

                    const mainAmt = maintenanceRules.maintenanceDetails.creditAmount; // 1500
                    const transactionDet = this.fetchTotalCreditAmt(flatNo);
                    const maintainanceDet = this.fetchMaintenanceDetails(flatNo);
                    const transactions = this.fetchAllTransactions(flatNo);

                    Promise.all([transactionDet, maintainanceDet, transactions])
                        .then((data) => {
                            const transactionData: any = data[0];
                            const maintainanceDet: any = data[1];
                            const allTransactions: any = data[2];

                            const { creditAmount } = transactionData;
                            // console.log("creditAmount=", creditAmount);
                            const { pendingMonths, totalMaintanceAmt } = maintainanceDet;
                            // console.log("totalMaintanceAmt=", totalMaintanceAmt);

                            let diffAmt = creditAmount - totalMaintanceAmt;
                            let tempMaintAmt = totalMaintanceAmt;
                            // console.log("diffAmt=", diffAmt);

                            const maintainance = pendingMonths.map((pendingMonDate: any, index: number) => {

                                const penaltyAmt = maintenanceRules.latePayment.penaltyAmt; //100
                                // console.log("date=", date);
                                const noPenaltyAmt = this.getNoPenaltyAmt(pendingMonDate, allTransactions, tempMaintAmt);

                                const newNoPenaltyAmt = noPenaltyAmt - totalMaintanceAmt;
                                // console.log("newNoPenaltyAmt=", newNoPenaltyAmt);

                                const noPenaltyMonthCnt = Math.trunc(newNoPenaltyAmt / mainAmt);
                                // console.log("noPenaltyMonthCnt=", noPenaltyMonthCnt);

                                let maintainanceAmt = 0;
                                let penaltyFromTo = "";
                                let penaltyMonCnt = 0;

                                let penaltyTotal = 0;
                                if (index >= noPenaltyMonthCnt) {
                                    penaltyMonCnt = (pendingMonths.length - index);
                                    penaltyTotal = (penaltyMonCnt * penaltyAmt);
                                    penaltyFromTo = `${transformDate(pendingMonths[index])}-${transformDate(pendingMonths[pendingMonths.length - 1])}`;
                                }

                                if ((mainAmt + penaltyTotal) <= diffAmt) {
                                    maintainanceAmt = mainAmt;
                                    diffAmt = diffAmt - (mainAmt + penaltyTotal);
                                    tempMaintAmt = tempMaintAmt + (mainAmt + penaltyTotal);
                                }

                                const newRow = {
                                    maintainanceAmt,
                                    date: pendingMonDate,
                                    penaltyAmt: penaltyTotal,
                                    penaltyMonCnt,
                                    penaltyFromTo
                                }
                                return newRow;
                            });

                            resolve(maintainance);
                        })
                        .catch((err) => {
                            reject(err);
                        });
                })
                .catch((err) => { reject(err)});
        });
    }

    private insertMaintenanceData(flatNo: string, params: any) {
        return new Promise((res, rej) => {
            const query = "INSERT INTO `maintainance_master`"
                + "(`date`, `flat_no`, `maintainance_amt`,"
                + "`penalty_amt`, `penalty_mon_cnt`, `penalty_from_to`)"
                + " VALUES (?, ?, ?, ?, ?, ?)";

            const { date, maintainanceAmt, penaltyAmt, penaltyMonCnt, penaltyFromTo } = params;

            const queryParams = [date, flatNo, maintainanceAmt, penaltyAmt, penaltyMonCnt, penaltyFromTo];
            mysqlConnection.query(query, queryParams, (err: any, row: any) => {
                if (!err) {
                    res({ message: "Transaction added." });
                } else {
                    console.log(err);
                    rej(err);
                }
            });
        });
    }

    getMaintenanceAmt(flatNo: string) {
        return new Promise((resolve, reject) => {
            this.precessMaintenance(flatNo)
                .then(async (data: any) => {
                    for (const obj of data) {
                        await this.insertMaintenanceData(flatNo, obj);
                    }
                    resolve(data);
                })
                .catch((err) => { reject(err) });
        });
    }
}