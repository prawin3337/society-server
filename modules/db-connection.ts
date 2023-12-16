import mysql from "mysql2";

export default mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    database: "society-db"
});

export class DbConnect {
    dbConnection: any;
    constructor() {
        this.dbConnection = mysql.createConnection({
            host: "localhost",
            user: "root",
            password: "password",
            database: "society-db"
        })

        this.dbConnection.connect((err: any) => {
            if (!err) {
                console.log("DB connected.");
            } else {
                console.log("DB connection fail", JSON.stringify(err));
            }
        });
    }
}