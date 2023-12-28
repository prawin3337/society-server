import { NextFunction, Request, Response } from "express";
import { transformMap } from "../util";
const mysqlConnection = require('./db-connection');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

export class TransactionModule {

    constructor() { }

    addTransaction(params: any) {
        return new Promise((res, rej) => {
            const { flatNo, amount, transactionCode, transactionDate, photo,
                transactionType, userId, description, isCredit, receiptNumber } = params;
            const systemDate = `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`;
            
            const query = "INSERT INTO `transaction_master`"
                         +"(`amount`, `description`, `date`, `user_id`, `transaction_code`,"
                         +"`transaction_date`, `type`, `is_credit`, `flat_no`, `receipt_number`, `photo`)"
                         +" VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            const queryParams = [amount, description, systemDate, userId, transactionCode,
                transactionDate, transactionType, isCredit, flatNo, receiptNumber, photo];
        
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

    getTransactions(flatNo: string) {
        return new Promise((res, rej) => {
            const query = "select * from transaction_master where flat_no=? order by transaction_date desc";
            mysqlConnection.query(query, [flatNo], (err: any, row: any) => {
                if (!err) {
                    const map = new Map([
                        ['id', 'id'],
                        ['amount', 'amount'],
                        ['description', 'description'],
                        ['date', 'date'],
                        ['transaction_code', 'transactionCode'],
                        ['transaction_date', 'transactionDate'],
                        ['type', 'type'],
                        ['is_credit', 'isCredit'],
                        ['receipt_number', 'receiptNumber'],
                        ['flat_no', 'flatNo'],
                        ['photo', 'photo'],
                        ['user_id', 'userId'],
                        ['is_appoved', 'isAppoved'],
                        ['apporved_by', 'apporvedBy']
                    ]);
                    const result: any = transformMap(row, map);
                    res(result);
                } else {
                    console.log(err);
                    rej(err);
                }
            })
        });
    }
}