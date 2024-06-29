import { toMySQLDate, transformMap } from "../util";
const mysqlConnection = require('./db-connection');

export class PettyCashModule {
    private map = new Map([
        ['id', 'id'],
        ['flat_no', 'flatNo'],
        ['credit_amount', 'creditAmount'],
        ['debit_amount', 'debitAmount'],
        ['description', 'description'],
        ['date', 'date'],
        ['transaction_ref', 'transactionRef'],
        ['transaction_date', 'transactionDate'],
        ['user_id', 'userId']
    ]);

    getAllTransactions(): Promise<any> {
        return new Promise((res, rej) => {
            const query = "select * from petty_cash order by transaction_date";
            try {
                mysqlConnection.query(query, (err: any, row: any) => {
                    if (!err) {
                        const result: any = transformMap(row, this.map);
                        res(result);
                    } else {
                        console.log(err);
                        rej(err);
                    }
                })
            }
            catch(err) {
                console.log('Failed SQL query:', err);
                rej(err);
            }
        });
    }

    async getSummary() {
        const trans = await this.getAllTransactions();
        let totalCreditAmount = 0;
        let totalDebitAmount = 0;
        let balanceAmount = 0;

        trans.forEach((row: any) => {
            if(row.debitAmount !== null) {
                totalDebitAmount += parseFloat(row.debitAmount);
            }

            if (row.creditAmount !== null) {
                totalCreditAmount += parseFloat(row.creditAmount);
            }

            balanceAmount = totalCreditAmount - totalDebitAmount;
        });
        return { totalCreditAmount, totalDebitAmount, balanceAmount };
    }

    addTransaction(params: any) {
        return new Promise((res, rej) => {
            const { flatNo, creditAmount: creditAmount, transactionDate,
                userId, description, debitAmount, transactionRef } = params;
            const systemDate = toMySQLDate(new Date());

            const query = "INSERT INTO `petty_cash`"
                + "(`flat_no`, `credit_amount`, `debit_amount`, `description`, `date`, `user_id`,"
                + "`transaction_date`, `transaction_ref`)"
                + " VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

            const queryParams = [flatNo, creditAmount, debitAmount, description, systemDate, userId,
                transactionDate, transactionRef];

            try {
                mysqlConnection.query(query, queryParams, (err: any, row: any) => {
                    if (!err) {
                        res({ message: "Transaction added." });
                    } else {
                        console.log(err);
                        rej(err);
                    }
                });
            }
            catch(err) {
                console.log('Failed SQL query:', err);
                rej(err);
            }
        });
    }

    deleteTransaction(params: any) {
        const { id } = params;

        return new Promise((res, rej) => {
            const query = "delete from petty_cash where id=?";
            mysqlConnection.query(query, [id], (err: any, row: any) => {
                if (!err) {
                    res(row);
                } else {
                    console.log(err);
                    rej(err);
                }
            })
        });
    }
}