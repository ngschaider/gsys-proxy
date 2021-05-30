import express from "express";
import LoginToken from "../../models/LoginToken";
import ResponseCode from "../ResponseCode";
import ResponseMessage from "../ResponseMessage";
import ResponseType from "../ResponseType";

const RequireAdmin = (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    let originalMethod = descriptor.value;

    descriptor.value = (req: express.Request, res: express.Response, ...rest: any[]) => {
        if(req.user && req.user.isAdmin) {
            originalMethod(req, res, ...rest);
        } else {
            res.json({
                type: ResponseType.Error,
                code: ResponseCode.NOT_ENOUGH_PERMISSIONS,
                message: ResponseMessage.NOT_ENOUGH_PERMISSIONS,
            });
        }
    }

}

export default RequireAdmin;