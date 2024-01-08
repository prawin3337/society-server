import { Router, Request, Response } from "express";
import { ApiResponse } from "../modules/response.module";
import { MaintenanceModule } from "../modules/maintenance.module";
import { AuthModule } from "../modules/auth.module";

const router = Router();
const authModule = new AuthModule();
const maintenanceModule = new MaintenanceModule();

router.post('/calculate', (req: any, res: Response) => {
    const {flatNo} = req.body;
    maintenanceModule
        .updateMaintenanceAmt(flatNo)
        .then((data) => {
            res.send(data);
        })
        .catch((err) => { res.send(); })
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