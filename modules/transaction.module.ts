// import { NextFunction, Request, Response } from "express";
import { toMySQLDate, transformMap } from "../util";
import { GoogleDriveAPI } from "./GoogleDriveAPI";
const mysqlConnection = require('./db-connection');
// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcrypt');
import { readFile, utils as xlsxUtils, writeFile as xlsxWriteFile } from "xlsx";

export class TransactionModule {

    private map = new Map([
        ['id', 'id'],
        ['credit_amount', 'creditAmount'],
        ['debit_amount', 'debitAmount'],
        ['description', 'description'],
        ['date', 'date'],
        ['transaction_code', 'transactionCode'],
        ['transaction_date', 'transactionDate'],
        ['type', 'type'],
        ['transaction_type', 'transactionType'], // for drive file
        ['receipt_number', 'receiptNumber'],
        ['flat_no', 'flatNo'],
        ['photo', 'photo'],
        ['user_id', 'userId'],
        ['is_approved', 'isApproved'],
        ['checker', 'checker'],
        ['balance_amount', 'balanceAmount'],
        ['db_record', 'dbRecord']
    ]);
    private googleAPI: GoogleDriveAPI;

    constructor() { 
        this.googleAPI = new GoogleDriveAPI('15Zzrqcl12S2_KDUtD5qlbmddvTHSe0Ix1PmT1twYCQU');
    }

    addTransaction(params: any) {
        return new Promise((res, rej) => {
            const { flatNo, creditAmount: creditAmount, transactionCode, transactionDate, photo,
                transactionType, userId, description, receiptNumber, debitAmount } = params;
            const systemDate = toMySQLDate(new Date());
            
            const query = "INSERT INTO `transaction_master`"
                         +"(`credit_amount`, `description`, `date`, `user_id`, `transaction_code`,"
                         +"`transaction_date`, `type`, `flat_no`, `receipt_number`,`photo`, `balance_amount`, `debit_amount`)"
                         +" VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            const balanceAmount = creditAmount || 0;

            const queryParams = [creditAmount, description, systemDate, userId, transactionCode,
                transactionDate, transactionType, flatNo, receiptNumber, photo, balanceAmount, debitAmount];
        
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

    getTotalCreditAmt(flatNo: string) {
        return new Promise((res, rej) => {
            const query = "select sum(credit_amount) as creditAmount from transaction_master where flat_no=?";
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

    getTotalValidCredAmt(flatNo: string) {
        return new Promise((res, rej) => {
            const query = "select sum(credit_amount) as creditAmount from transaction_master where is_approved='y' and flat_no=?";
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

    getAllMemberTransactions(flatNo: string) {
        return new Promise((res, rej) => {
            const query = "select * from transaction_master where flat_no=? order by transaction_date";
            mysqlConnection.query(query, [flatNo], (err: any, row: any) => {
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

    getMemberTransactions(flatNo: string, financYear: {fromDate: Date, toDate:Date}) {
        const {fromDate, toDate } = financYear;
        return new Promise((res, rej) => {
            const query = "select * from transaction_master where flat_no=? and "
                +"transaction_date between ? and ? order by transaction_date desc";
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

    getAllTransactions() {
        return new Promise((res, rej) => {
            const query = "select * from transaction_master order by transaction_date desc";
            mysqlConnection.query(query, (err: any, row: any) => {
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

    updateTransactinBalAmt(params: any) {
        const { balanceAmount, id} = params;
        return new Promise((res, rej) => {
            const query = "update transaction_master set balance_amount=? where id=?";
            mysqlConnection.query(query, [balanceAmount, id], (err: any, row: any) => {
                if (!err) {
                    res(row);
                } else {
                    console.log(err);
                    rej(err);
                }
            })
        });
    }

    approveTransaction(params: any) {
        const { id, isApproved, userId: checker } = params;
        return new Promise((res, rej) => {
            const query = "update transaction_master set is_approved=?, checker=? where id=?";
            mysqlConnection.query(query, [isApproved, checker, id], (err: any, row: any) => {
                if (!err) {
                    res(row);
                } else {
                    console.log(err);
                    rej(err);
                }
            })
        });
    }

    deleteTransaction(params: any) {
        const { id } = params;

        return new Promise((res, rej) => {
            const query = "delete from transaction_master where id=?";
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

    getTransactionOverview() {
        return new Promise((res, rej) => {
            const query = "select * from transaction_master order by transaction_date";
            mysqlConnection.query(query, (err: any, row: any) => {
                if (!err) {
                    const result: any = transformMap(row, this.map);

                    let approvedCreditAmt = 0;
                    let nonApprovedCreditAmt = 0;
                    let approvedDebitAmt = 0;
                    let nonApprovedDebitAmt = 0;

                    result.forEach((trans: any) => {
                        if (trans.creditAmount !== null && trans.isApproved === 'y') {
                            approvedCreditAmt += parseFloat(trans.creditAmount);
                        }

                        if (trans.creditAmount !== null && trans.isApproved !== 'y') {
                            nonApprovedCreditAmt += parseFloat(trans.creditAmount);
                        }

                        if (trans.debitAmount !== null && trans.isApproved === 'y') {
                            approvedDebitAmt += parseFloat(trans.debitAmount);
                        }

                        if (trans.debitAmount !== null && trans.isApproved !== 'y') {
                            nonApprovedDebitAmt += parseFloat(trans.debitAmount);
                        }
                    });

                    const currentBalanceAmt = approvedCreditAmt - approvedDebitAmt;
                    const postApprovelBalanceAmt = (approvedCreditAmt + nonApprovedCreditAmt) - (approvedDebitAmt + nonApprovedDebitAmt);
                    const recentTransactionDate = result[row.length - 1].transactionDate;

                    res({
                        approvedCreditAmt,
                        nonApprovedCreditAmt,
                        approvedDebitAmt,
                        nonApprovedDebitAmt,
                        currentBalanceAmt,
                        postApprovelBalanceAmt,
                        recentTransactionDate
                    });
                } else {
                    console.log(err);
                    rej(err);
                }
            })
        });
    }

    async updateDriveTransactions() {
        // const fileDetails = {
        //     fileName: 'society-transaction.xlsx',
        //     filePath: '/mnt/2ca2e905-ae12-4703-9fdd-6c8691abadaa/APPS/society-managment/server/downloads/drive/'
        // }

        // Download file from google drive
        const fileDetails: any = await this.googleAPI.downloadFile();
        const filePath = fileDetails.filePath;
        let trasactionUpdateCnt = 0;

        // Read file data
        const fileData: any[] = await this.readTransFile(filePath);
        const dataArr: any = transformMap(fileData, this.map);

        for await (const [index, row] of dataArr.entries()) {
            const date = row.date ? new Date(row.date) : new Date();
            row.transactionDate = toMySQLDate(date);

            if ([undefined, null, false, 'false'].includes(row.dbRecord)) { // Add new transactions only
                await this.addTransaction(row).then(() => {
                    fileData[index]['db_record'] = 'true';
                    trasactionUpdateCnt++;
                }).catch((err) => {
                    fileData[index]['db_record'] = "false";
                    fileData[index]['server_note'] = JSON.stringify(err);
                });
            }
        }

        const res = await this.updateDriveTransFile(fileData, fileDetails);
        return { trasactionUpdateCnt };
    }

    async readTransFile(filePath: string) {
        const file = readFile(filePath);
        return xlsxUtils.sheet_to_json(file.Sheets[file.SheetNames[0]], { raw: false });
    }

    async updateDriveTransFile(rows: any, fileDetails:any) {
        const workbook = await readFile(fileDetails.filePath);
        const worksheet = xlsxUtils.json_to_sheet(rows);
        workbook.Sheets[workbook.SheetNames[0]] = worksheet;
        await xlsxWriteFile(workbook, fileDetails.filePath);
        return await this.googleAPI.updateFile(fileDetails.filePath, fileDetails.fileName);
    }
}