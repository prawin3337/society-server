import { Router, Request, Response } from "express";
import { ApiResponse } from "../modules/response.module";
import { MaintenanceModule } from "../modules/maintenance.module";
import { AuthModule } from "../modules/auth.module";
import { Member } from "../modules/member.module";

const router = Router();
const authModule = new AuthModule();
const maintenanceModule = new MaintenanceModule();

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

    const members = new Member();

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
    const flatNo = req.query.flatNo;
    const financYear = JSON.parse(req.query.financYear);

    maintenanceModule.getMentainance(flatNo, financYear)
        .then((row) => {
            const apiRes = new ApiResponse(null, row);
            res.status(apiRes.statusCode).json(apiRes.data);
        }).catch((err) => {
            const apiRes = new ApiResponse(err, {});
            res.status(apiRes.statusCode).json(apiRes.data);
        });
});

module.exports = router;