import mysql from "mysql2";

export class DbConnect {
    connect: any;
    constructor() {
        this.connect = mysql.createConnection({
            host: "localhost",
            user: "root",
            password: process.env.DB_PASSWORD,
            database: "society-db"
        })

        this.connect.connect((err: any) => {
            if (!err) {
                console.log("DB connected.");
            } else {
                console.log("DB connection fail", JSON.stringify(err));
            }
        });
    }
}