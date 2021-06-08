import {Request, Response, NextFunction} from "express";
import LoginToken from "../models/LoginToken";
import User from "../models/User";

export default async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.GSYSAuthCookie;

    if(token) {
        const loginToken = await LoginToken.findOne({
            relations: ["user"],
            where: {token}
        });
        if(loginToken) {
            req.user = loginToken.user;
        }
    }

    if(req.user) {
        next();
    } else {
        const origin = encodeURIComponent(req.protocol + "://" + req.headers.host + req.originalUrl)
        res.redirect(307, "https://accounts.gsys.at/login?origin=" + origin);
    }
}