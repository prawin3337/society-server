import { NextFunction, Request, Response } from "express";
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
}