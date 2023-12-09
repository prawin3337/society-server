import { NextFunction, Request, Response, Router } from "express";

const indexRouter = Router();

/* GET home page. */
indexRouter.get('/', function(req: Request, res: Response, next: NextFunction) {
  res.render('index', { title: 'Express' });
});

module.exports = indexRouter;
