import LoginToken from "../models/LoginToken";
import {Request, Response, NextFunction} from "express";
import Service from "../models/Service";
import path from "path";

const authenticationMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.GSYSAuthCookie;

    req.service = await Service.findOne({
        hostname: req.hostname,
    });

    if(token) {
        req.loginToken = await LoginToken.findOne({token});    

        if(req.loginToken) {
            req.user = req.loginToken.user;

            if(req.user) {
                req.serviceUser = req.user.serviceUsers.find(async serviceUser => {
                    const service2 = await serviceUser.service;
                    return service2 === req.service;
                });
            }
        }
    }

    next();
}
export default authenticationMiddleware;