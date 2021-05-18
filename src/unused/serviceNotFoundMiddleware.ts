import { Request, Response, NextFunction } from "express";

const serviceNotFoundMiddleware = (req: Request, res: Response, next: NextFunction) => {

    if(!req.service) {
        res.sendFile()
    }

}