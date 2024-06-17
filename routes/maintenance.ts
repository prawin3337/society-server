import { Router, Request, Response } from "express";
import { ApiResponse } from "../modules/response.module";
import { MaintenanceModule } from "../modules/maintenance.module";
import { AuthModule } from "../modules/auth.module";
import { Member } from "../modules/member.module";
import { TransactionModule } from "../modules/transaction.module";
import { Mailer } from "../modules/mailer/Mailer";

const router = Router();
const authModule = new AuthModule();
const maintenanceModule = new MaintenanceModule();
const members = new Member();
const transactionModule = new TransactionModule();

router.post('/calculate', authModule.authenticateToken, (req: any, res: Response) => {
    const { flatNo } = req.body;
    maintenanceModule
        .updateMaintenanceAmt(flatNo)
        .then((data) => {
            const apiRes = new ApiResponse(null, data);
            res.status(apiRes.statusCode).json(apiRes.data);
        })
        .catch((err) => {
            const apiRes = new ApiResponse(err, {});
            res.status(apiRes.statusCode).json(apiRes.data);
        });
});

router.post('/calculate/all', (req: any, res: Response) => {

    const { username, password } = req.body;
    if (username !== "appadmin" || password !== "Society@02$") {
        res.status(500).json({
            status: false,
            message: "Auth error!"
        });
        return;
    }

    members.getMemberIds(async (err: any, data: any) => {
        if (err) {
            const apiRes = new ApiResponse(err, {});
            res.status(apiRes.statusCode).json(apiRes.data);
            return;
        }

        data = data.filter((member: any) => member.flatNo !== "0"); // Remove society flat number from maintainance calculation.

        let error = null;
        let rec: any = [];
        for (var i = 0; i < data.length; i++) {

            await setTimeout(() => { }, 1000 * 10);

            const { flatNo } = data[i];
            await maintenanceModule
                .updateMaintenanceAmt(flatNo)
                .then((data: any) => {
                    rec.push({ ...data, flatNo });
                })
                .catch((err) => {
                    error = err;
                });

            if (error) {
                const apiRes = new ApiResponse(error, {});
                res.status(apiRes.statusCode).json(apiRes.data);
                break;
            }
        }

        try {
            await sendTransactionDetMail();
        }
        catch(err) {
            console.log(err);
        }

        const apiRes = new ApiResponse(null, rec);
        res.status(apiRes.statusCode).json(apiRes.data);
    });
});

router.get("/all", authModule.authenticateToken, (req: any, res: any, next: any) => {
    const { flatNo, financYear } = req.query;

    if (flatNo && financYear) {
        maintenanceModule.getMentainance(flatNo, JSON.parse(financYear))
            .then((row) => {
                const apiRes = new ApiResponse(null, row);
                res.status(apiRes.statusCode).json(apiRes.data);
            }).catch((err) => {
                const apiRes = new ApiResponse(err, {});
                res.status(apiRes.statusCode).json(apiRes.data);
            });
    } else {
        maintenanceModule.getAllMentainance()
            .then((row) => {
                const apiRes = new ApiResponse(null, row);
                res.status(apiRes.statusCode).json(apiRes.data);
            }).catch((err) => {
                const apiRes = new ApiResponse(err, {});
                res.status(apiRes.statusCode).json(apiRes.data);
            });
    }
});

router.get("/reports", authModule.authenticateToken, (req: any, res: any, next: any) => {
    const { financYear } = req.query;
    members.getMemberIds(async (err: any, result: any) => {
        if (!err) {
            try {
                const maintainanceDetails = await getMaintainanceDetails(financYear, result);
                const apiRes = new ApiResponse(null, maintainanceDetails);
                res.status(apiRes.statusCode).json(apiRes.data);
            } catch(err) {
                const apiRes = new ApiResponse(err, {});
                res.status(apiRes.statusCode).json(apiRes.data);
            }
        } else {
            const apiRes = new ApiResponse(err, {});
            res.status(apiRes.statusCode).json(apiRes.data);
        }
    })
});

async function getMaintainanceDetails(financYear: any, result: any) {
    const memrs: any[] = result.filter((obj: any) => obj.flatNo !== "0");
    let maintainanceDetails: any = [];

    // Add pending maintaincance details
    await setPendingMaintaincanceDetails(memrs, financYear)
        .then((data) => {
            maintainanceDetails = data
        })

    // Add last transaction details
    await setTransactionDetails(maintainanceDetails)
        .then((data) => {
            maintainanceDetails = data
        })
    return maintainanceDetails;
}

async function setPendingMaintaincanceDetails(members: any[], financYear: any) {
    let maintainanceDetails: any = [];
    for (const member of members) {
        const { flatNo, owner } = member;
        await maintenanceModule.getMentainance(flatNo, JSON.parse(financYear))
            .then((data: any) => {
                const penaltyData = data.filter(({ penaltyMonCnt, maintainanceAmt }: any) => {
                    return (penaltyMonCnt > 0 && !maintainanceAmt)
                });

                const obj = {
                    owner,
                    flatNo: data[0].flatNo,
                    totalPenaltyAmt: 0,
                    penaltyMonCnt: 0,
                    pendingMaintainanceAmt: 0,
                    totalPendingAmt: 0
                };
                penaltyData.forEach((d: any) => {
                    obj.totalPenaltyAmt += d.penaltyAmt;
                    obj.penaltyMonCnt = d.penaltyMonCnt;
                    obj.pendingMaintainanceAmt = (1500 * penaltyData.length);
                    obj.totalPendingAmt = (obj.pendingMaintainanceAmt + obj.totalPenaltyAmt);
                });
                maintainanceDetails.push(obj);
            }).catch((err) => {
                return Promise.reject(err);
            });
    }
    return Promise.resolve(maintainanceDetails);
}

async function setTransactionDetails(maintainanceDetails: any[]): Promise<any> {
    for (const tran of maintainanceDetails) {
        await transactionModule.getAllMemberTransactions(tran.flatNo)
            .then((data: any) => {
                const d = data.filter((o: any) => o.isApproved === "y");
                const {
                    creditAmount: lastTransactionAmount,
                    description,
                    transactionCode: lastTransactionCode,
                    transactionDate: lastTransactionDate,
                    isApproved,
                    checker,
                    balanceAmount,
                    receiptNumber
                } = d[d.length - 1];

                Object.assign(tran, {
                    lastTransactionCode,
                    lastTransactionDate: new Date(lastTransactionDate).toDateString(),
                    lastTransactionAmount,
                    description,
                    isApproved,
                    checker,
                    balanceAmount,
                    receiptNumber
                });
            })
            .catch((err) => {
                return Promise.reject(err);
            });
    }
    return Promise.resolve(maintainanceDetails);
}

const transOverviewTplt = (data: any) => `
    <table>
        <tr>
            <th>Recent Transaction Date</th>
            <th>Pre-approvel Balance</th>
            <th>Post-approvel Balance</th>
            <th>Non-Approved Credit Amount</th>
            <th>Non-Approved Debit Amount</th>
        </tr>
        <tr>
            <td>
                ${new Date(data.recentTransactionDate).getDate()}/
                ${new Date(data.recentTransactionDate).getMonth()}/
                ${new Date(data.recentTransactionDate).getFullYear()}
            </td>
            <td>${data.currentBalanceAmt}</td>
            <td>${data.postApprovelBalanceAmt}</td>
            <td>${data.nonApprovedCreditAmt}</td>
            <td>${data.nonApprovedDebitAmt}</td>
        </tr>
    </table>
`;

const maintDetailsTeml = (data: any[]) => {
    const tbl = `<table>
        <tr>
            <th>Owner</th>
            <th>Flat No</th>
            <th>Total Penalty Amount</th>
            <th>Penalty Month Count</th>
            <th>Pending Maintainance Amount</th>
            <th>Total Pending Amount</th>
            <th>Last Transaction Amount</th>
            <th>Last Transaction Date</th>
            <th>Balance Amount</th>
        </tr>`;
    let str = '';
    data.forEach((obj) => {
        let tr = '<tr>';
        if (obj.pendingMaintainanceAmt > 0) {
            tr = '<tr class="red">'
        }
        str+=tr+`
            <td>${obj.owner}</td>
            <td>${obj.flatNo}</td>
            <td>${obj.totalPenaltyAmt}</td>
            <td>${obj.penaltyMonCnt}</td>
            <td>${obj.pendingMaintainanceAmt}</td>
            <td>${obj.totalPendingAmt}</td>
            <td>${obj.lastTransactionAmount}</td>
            <td>${obj.lastTransactionDate}</td>
            <td>${obj.balanceAmount}</td>
        </tr>`
    });

    return tbl+str+'</table>';
}

async function sendTransactionDetMail() {
    const fYear = JSON.stringify({fromDate: new Date('2020'), toDate: new Date()});
    let maintainanceDetails: any[] = [];
    await members.getMemberIds(async (err: any, result: any) => {
        if (!err) {
            maintainanceDetails = await getMaintainanceDetails(fYear, result);

            transactionModule.getTransactionOverview()
                .then((data: any) => {
                    const html = `
                        <html>
                            <head>
                                <style>
                                    table {
                                        font-size: 10px;
                                    }
                                    td, th {
                                        border: 1px solid #dddddd;
                                        text-align: left;
                                        padding: 8px;
                                    }
                                    .red {
                                        background-color: red;
                                        color: white
                                    }
                                </style>
                            </head>
                            <body>
                                ${transOverviewTplt(data)}
                                ${maintDetailsTeml(maintainanceDetails)}
                            </body>
                        </html>
                    `;
                    const transOverviewMailer = new Mailer();
                    transOverviewMailer.sendMail("Maintainace details", '', html);
                });
        }
    });
}

module.exports = router;