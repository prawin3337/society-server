import mysql from "mysql2";

// export class DbConnect {
//     connect: any;
//     constructor() {
//         this.connect = mysql.createConnection({
//             host: "localhost",
//             user: "root",
//             password: process.env.DB_PASSWORD,
//             database: "society-db"
//         })

//         this.connect.connect((err: any) => {
//             if (!err) {
//                 console.log("DB connected.");
//             } else {
//                 console.log("DB connection fail", JSON.stringify(err));
//             }
//         });
//     }
// }

// var mysqlConnection = mysql.createConnection({
//     host: "localhost",
//     user: "root",
//     password: process.env.DB_PASSWORD,
//     database: "society-db",
//     multipleStatements: true
// });

// mysqlConnection.connect((err) => {
//     if (!err) {
//         console.log("DB connected.");
//     } else {
//         console.log("DB connection fail", JSON.stringify(err));
//     }
// });

const mysqlConnection  = mysql.createPool({
    connectionLimit: 50,
    host: 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'society-db'
});

module.exports = mysqlConnection;