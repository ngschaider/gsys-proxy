import { Request, Response, NextFunction } from "express";
import path from "path";
import { ServiceType } from "../models/Service";

const proxyMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if(!req.service) {
        res.sendFile(path.resolve("static/notFound.html"));
        return;
    }

    if(req.service.type === ServiceType.PVE) {
        
    }
}
export default proxyMiddleware;