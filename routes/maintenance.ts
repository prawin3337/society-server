import { Router, Request, Response } from "express";
import { ApiResponse } from "../modules/response.module";
import { MaintenanceModule } from "../modules/maintenance.module";

const router = Router();

router.post('/calculate', (req: Request, res: Response) => {
    const {flatNo} = req.body;
    new MaintenanceModule()
        .getMaintenanceAmt(flatNo)
        .then((data) => {
            res.send(data);
        })
        .catch()
});

module.exports = router;