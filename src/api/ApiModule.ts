import { Express, RequestHandler, Response, Request, NextFunction } from "express";
import ResponseCode from "./ResponseCode";
import ResponseMessage from "./ResponseMessage";
import ResponseType from "./ResponseType";

export type RouteRegister = {
    get: (path: string, cb: RequestHandler) => void;
    head: (path: string, cb: RequestHandler) => void;
    post: (path: string, cb: RequestHandler) => void;
    put: (path: string, cb: RequestHandler) => void;
    delete: (path: string, cb: RequestHandler) => void;
    connect: (path: string, cb: RequestHandler) => void;
    options: (path: string, cb: RequestHandler) => void;
    trace: (path: string, cb: RequestHandler) => void;
    patch: (path: string, cb: RequestHandler) => void;
}

export default abstract class ApiModule {

    basePath: string;

    constructor(basePath: string) {
        this.basePath = basePath;
    }

    abstract registerRoutes(route: RouteRegister): void;

    notEnoughParameters(res: Response) {
        res.json({
            type: ResponseType.Error,
            code: ResponseCode.NOT_ENOUGH_PARAMETERS,
            message: ResponseMessage.NOT_ENOUGH_PARAMETERS,
        });
    }

    invalidToken(res: Response)  {
        res.json({
            type: ResponseType.Error,
            message: ResponseMessage.INVALID_TOKEN,
            code: ResponseCode.INVALID_TOKEN,
        });
    }


}