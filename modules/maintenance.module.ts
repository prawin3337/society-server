import { TransactionModule } from "./transaction.module";
const mysqlConnection = require('./db-connection');
import { transformMap, maintenanceRules, transformDate } from "../util";

export class MaintenanceModule {

    private map = new Map([
        ['id', 'id'],
        ['date', 'date'],
        ['flat_no', 'flatNo'],
        ['maintainance_amt', 'maintainanceAmt'],
        ['penalty_amt', 'penaltyAmt'],
        ['penalty_mon_cnt', 'penaltyMonCnt'],
        ['penalty_from_to', 'penaltyFromTo']
    ]);

    private transactionModule = new TransactionModule();

    lastMaintenanceDate = new Date("nov-01-2021"); // Default maintainance start date.

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
                .getAllMemberTransactions(flatNo)
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

    // private getNoPenaltyAmt(pendingMonDate: any, allTransactions: any, tempMaintAmt: number) {
    //     const newTransactions = allTransactions;

    //     const { ruleDate, latePayDate } = maintenanceRules.latePayment;
    //     const validTrans = newTransactions.filter((obj: any) => obj.isApproved == 'y');

    //     const noPenaltyMon = validTrans.filter((obj: any) => {
    //         const tranDate = new Date(obj.transactionDate);
    //         let noPen = false;

    //         if ((tranDate.getTime() < ruleDate.getTime())) {
    //             noPen = true;
    //             return noPen;
    //         }

    //         if (tranDate.getTime() < pendingMonDate.getTime()) {
    //             noPen = true;
    //         }

    //         return noPen;
    //     });

    //     const noPenaltyAmt = noPenaltyMon
    //         .reduce((prevTran: any, curTran: any) => {
    //             return (prevTran + Number(curTran.creditAmount))
    //         }, 0);

    //     return (noPenaltyAmt);
    // }

    private precessMaintenance(flatNo: string) {
        return new Promise((resolve, reject) => {
            this.deleteZeroMaintenance(flatNo)
                .then((deleteRec) => {
                    console.log("Deleted zero maintenace records:", deleteRec);

                    const mainAmt = maintenanceRules.maintenanceDetails.creditAmount; // 1500
                    const maintainanceDet = this.fetchMaintenanceDetails(flatNo);
                    const transactions = this.fetchAllTransactions(flatNo);

                    Promise.all([maintainanceDet, transactions])
                        .then((data) => {
                            const maintainanceDet: any = data[0];
                            let allTransactions: any = data[1];

                            // remove not apporoved transactions.
                            allTransactions = allTransactions.filter((tras:any) => {
                                return tras.isApproved === "y";
                            });

                            const { ruleDate, latePayDate } = maintenanceRules.latePayment;

                            let { pendingMonths, totalMaintanceAmt } = maintainanceDet;

                            let maintainanceArr: any = [];
                            let pendingMainArr: any = [];

                            let balAmount = 0;



                            allTransactions.forEach((transaction: any, tranIndex: number) => {

                                const tranDate = transaction.transactionDate;

                                // if (totalMaintanceAmt > 0) {
                                //     transaction.balanceAmount -= totalMaintanceAmt;
                                //     totalMaintanceAmt = 0;
                                // }

                                if (balAmount > 0) {
                                    transaction.balanceAmount += balAmount;
                                    balAmount = 0;
                                }

                                for (let i = 0; i < pendingMonths.length; i++) {
                                    const pendingMon = pendingMonths[i];
    
                                    const isMaintnAdd = maintainanceArr.some((obj: any) => obj.date == pendingMon);
                                    if (!isMaintnAdd) {
                                        let penaltyAmt = 0;
                                        let penaltyMonCnt = 0;
                                        let penaltyFromTo = "";

                                        if ((ruleDate.getTime() < tranDate.getTime())) {
                                            if ((tranDate.getTime() > pendingMon.getTime())) {
                                                penaltyMonCnt = pendingMonths.length - i;
                                                penaltyAmt = (penaltyMonCnt * 100);
                                                penaltyFromTo = `FROM ${transformDate(pendingMon)} TO ${transformDate(pendingMonths[pendingMonths.length - 1])}`
                                            }
                                        }

                                        if (((mainAmt + penaltyAmt) <= transaction.balanceAmount)) {
                                            transaction.balanceAmount -= (mainAmt + penaltyAmt);
                                            maintainanceArr.push({
                                                maintainanceAmt: mainAmt,
                                                date: pendingMon,
                                                penaltyAmt: penaltyAmt,
                                                penaltyMonCnt: penaltyMonCnt,
                                                penaltyFromTo: penaltyFromTo
                                            });
                                        } else {
                                            balAmount += transaction.balanceAmount;
                                            transaction.balanceAmount = 0;

                                            const isPendiMaintnAdd = pendingMainArr.find((obj: any) => obj.date == pendingMon);
                                            const obj = {
                                                maintainanceAmt: 0,
                                                date: pendingMon,
                                                penaltyAmt: penaltyAmt,
                                                penaltyMonCnt: penaltyMonCnt,
                                                penaltyFromTo: penaltyFromTo
                                            };

                                            if (isPendiMaintnAdd) {
                                                Object.assign(isPendiMaintnAdd, obj);
                                            } else {
                                                pendingMainArr.push(obj);
                                            }
                                        }
                                    }
                                }
                            });

                            // Remove dup transactions
                            pendingMainArr = pendingMainArr.filter((pendMain: any) =>
                                !maintainanceArr.some((mainObj: any) => pendMain.date == mainObj.date));

                            pendingMainArr.forEach((obj: any, i: number) => {
                                let newObj = {
                                    maintainanceAmt: 0,
                                    penaltyMonCnt: (pendingMainArr.length-i),
                                    penaltyAmt: ((pendingMainArr.length - i)*100),
                                    penaltyFromTo: `FROM ${transformDate(pendingMainArr[i].date)} TO ${transformDate(pendingMainArr[pendingMainArr.length - 1].date)}`
                                }
                                Object.assign(obj, newObj);
                            });

                            // console.log("allTransactions=", allTransactions);

                            resolve({
                                maintainance: [...maintainanceArr, ...pendingMainArr],
                                allTransactions // update balance ammount
                            });
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

    updateMaintenanceAmt(flatNo: string) {
        return new Promise((resolve, reject) => {
            this.precessMaintenance(flatNo)
                .then(async (data: any) => {
                    const { maintainance, allTransactions } = data;
                    for (const obj of maintainance) {
                        await this.insertMaintenanceData(flatNo, obj);
                    }

                    for(const obj of allTransactions) {
                        await this.transactionModule.updateTransactinBalAmt(obj);
                    }

                    resolve({});
                })
                .catch((err) => { reject(err) });
        });
    }

    getMentainance(flatNo: string, financYear: { fromDate: Date, toDate: Date }) {
        const { fromDate, toDate } = financYear;
        return new Promise((res, rej) => {
            const query = "select * from maintainance_master where flat_no=? and "
                + "date between ? and ? order by date desc";
            mysqlConnection.query(query, [flatNo, fromDate, toDate], (err: any, row: any) => {
                if (!err) {
                    const result: any = transformMap(row, this.map);
                    res(result);
                } else {
                    console.log(err);
                    rej(err);
                }
            })
        });
    }

    getAllMentainance() {
        return new Promise((res, rej) => {
            const query = "select * from maintainance_master order by date desc";
            mysqlConnection.query(query, [], (err: any, row: any) => {
                if (!err) {
                    const result: any = transformMap(row, this.map);
                    res(result);
                } else {
                    console.log(err);
                    rej(err);
                }
            })
        });
    }
}
