import express from "express";
import LoginToken from "../../models/LoginToken";
import BaseController from "../controllers/BaseController";
import ResponseCode from "../ResponseCode";
import ResponseMessage from "../ResponseMessage";
import ResponseType from "../ResponseType";

const LoggedIn = <T extends BaseController>(target: T, propertyKey: string, descriptor: PropertyDescriptor) => {
    let originalMethod = descriptor.value;

    descriptor.value = (req: express.Request, res: express.Response, ...rest: any[]) => {
        if(req.user) {
            originalMethod(req, res, ...rest);
        } else {
            target.invalidToken(res);
        }
    }

}

export default LoggedIn;