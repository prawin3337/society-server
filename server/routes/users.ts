import { NextFunction, Request, Response, Router } from "express";

const router = Router();
const { authenticateToken } = require('./auth')

/* GET users listing. */
router.get('/', authenticateToken, function(req: Request, res: Response, next: NextFunction) {
  res.send('respond with a resource');
});

module.exports = router;
