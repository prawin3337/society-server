import { NextFunction, Request, Response } from "express";
import { transformMap } from "../util";
const mysqlConnection = require('./db-connection');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

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
        ['receipt_number', 'receiptNumber'],
        ['flat_no', 'flatNo'],
        ['photo', 'photo'],
        ['user_id', 'userId'],
        ['is_approved', 'isApproved'],
        ['checker', 'checker'],
        ['balance_amount', 'balanceAmount']
    ]);

    constructor() { }

    addTransaction(params: any) {
        return new Promise((res, rej) => {
            const { flatNo, creditAmount: creditAmount, transactionCode, transactionDate, photo,
                transactionType, userId, description, receiptNumber, debitAmount } = params;
            const systemDate = `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`;
            
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

    getAllTransactions(flatNo: string) {
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

    getTransactions(flatNo: string, financYear: {fromDate: Date, toDate:Date}) {
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
}