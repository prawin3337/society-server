import { Router, Request, Response } from "express";
import { ApiResponse } from "../modules/response.module";
import { MaintenanceModule } from "../modules/maintenance.module";
import { AuthModule } from "../modules/auth.module";
import { Member } from "../modules/member.module";
import { TransactionModule } from "../modules/transaction.module";

const router = Router();
const authModule = new AuthModule();
const maintenanceModule = new MaintenanceModule();
const members = new Member();
const transactionModule = new TransactionModule();

router.post('/calculate', authModule.authenticateToken, (req: any, res: Response) => {
    const {flatNo} = req.body;
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

    members.getMemberIds(async (err:any, data:any) => {
        if(err) {
            const apiRes = new ApiResponse(err, {});
            res.status(apiRes.statusCode).json(apiRes.data);
            return;
        }

        data = data.filter((member: any) => member.flatNo !== "0"); // Remove society flat number from maintainance calculation.

        let error = null;
        let rec:any = [];
        for (var i = 0; i < data.length; i++) {

            await setTimeout(()=> {}, 1000*10);
 
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
        if(!err) {
            const memrs: any[] = result.filter((obj: any) => obj.flatNo !== "0");
            let maintainanceDetails:any = [];

            // Add pending maintaincance details
            await setPendingMaintaincanceDetails(memrs, financYear)
                .then((data) => {
                    maintainanceDetails = data
                })
                .catch((err) => {
                    const apiRes = new ApiResponse(err, {});
                    res.status(apiRes.statusCode).json(apiRes.data);
                });

            // Add last transaction details
            await setTransactionDetails(maintainanceDetails)
                .then()
                .catch((err) => {
                    const apiRes = new ApiResponse(err, {});
                    res.status(apiRes.statusCode).json(apiRes.data);
                });;

            const apiRes = new ApiResponse(null, maintainanceDetails);
            res.status(apiRes.statusCode).json(apiRes.data);
        } else {
            const apiRes = new ApiResponse(err, {});
            res.status(apiRes.statusCode).json(apiRes.data);
        }
    })
});

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

module.exports = router;