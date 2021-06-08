import { Controller, Get, Params, Response, Request, Query } from "@decorators/express";
import express from "express";
import { request } from "express";
import LoginToken from "../../models/LoginToken";
import User from "../../models/User";
import ResponseMessage from "../ResponseMessage";
import ResponseType from "../ResponseType";
import bcrypt from "bcryptjs";
import BaseController from "./BaseController";
import {validate as validateEmail} from "email-validator";
import ResponseCode from "../ResponseCode";

@Controller("/auth")
class AuthController extends BaseController {

    @Get("/login")
    async login(@Response() res: express.Response, @Request() req: express.Request) {
        const {usernameOrEmail, password} = req.query;
        if(!usernameOrEmail || !password) {
            res.json({
                type: ResponseType.Error, 
                code: ResponseCode.NOT_ENOUGH_PARAMETERS,
                message: ResponseMessage.NOT_ENOUGH_PARAMETERS,
            });
            return;
        };

        const where = usernameOrEmail.toString().includes("@") ? {email: usernameOrEmail} : {username: usernameOrEmail};
        const user = await User.findOne({where});

        if(user) {
            const valid = await bcrypt.compare(password.toString(), user.passwordHash);

            const loginToken = LoginToken.create({
                user: user,
            });
            await loginToken.save();

            if(valid) {
                req.loginToken = loginToken;
                req.user = user;

                res.json({
                    type: ResponseType.Success,
                    code: ResponseCode.LOGIN_OKAY,
                    message: ResponseMessage.LOGIN_OKAY,
                    token: loginToken.token,
                });
                return;
            }
        }

        res.json({
            type: ResponseType.Error,
            code: ResponseCode.WRONG_CREDENTIALS,
            message: ResponseMessage.WRONG_CREDENTIALS,
        });
    }

    @Get("/logout")
    async logout(@Request() req: express.Request, @Response() res: express.Response) {
        if(!req.user) {
            this.invalidToken(res);
            return;
        }

        await req.loginToken?.remove();
        req.loginToken = undefined;
        req.user = undefined;

        res.json({
            type: ResponseType.Success,
            code: ResponseCode.LOGOUT_OKAY,
            message: ResponseMessage.LOGOUT_OKAY,
        });
    }

}

export default AuthController;