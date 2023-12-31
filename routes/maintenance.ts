import { Router, Request, Response } from "express";
import { ApiResponse } from "../modules/response.module";
import { MaintenanceModule } from "../modules/maintenance.module";
import { AuthModule } from "../modules/auth.module";

const router = Router();
const authModule = new AuthModule();

router.post('/calculate', (req: any, res: Response) => {
    const {flatNo} = req.body;
    new MaintenanceModule()
        .getMaintenanceAmt(flatNo)
        .then((data) => {
            res.send(data);
        })
        .catch()
});

module.exports = router;