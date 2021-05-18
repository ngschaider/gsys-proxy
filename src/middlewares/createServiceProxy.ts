import { Request, Response, NextFunction } from "express";
import Service, { ServiceType } from "../models/Service";
import createPveProxy from "./createPveProxy";
import createTransparentProxy from "./createTransparentProxy";

const getTypeSpecificProxy = (service: Service) => {
    if(service.type === ServiceType.Transparent) {
        return createTransparentProxy(service);
    } else if(service.type === ServiceType.PVE) {
        return createPveProxy(service);
    }
}

const createServiceProxy = (service: Service) => {
    const middleware = getTypeSpecificProxy(service);

    return (req: Request, res: Response, next: NextFunction) => {
        if(req.service?.hostname !== service.hostname) {
            next();
            return;
        }

        if(middleware) {
            middleware(req, res, next);
        } else {
            next();
        }
    }
}
export default createServiceProxy;