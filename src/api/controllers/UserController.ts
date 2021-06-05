import { Controller, Get, Params, Post, Request, Response } from "@decorators/express";
import { request } from "express";
import express from "express";
import User from "../../models/User";
import ResponseType from "../ResponseType";
import BaseController from "./BaseController";
import LoginToken from "../../models/LoginToken";
import ResponseMessage from "../ResponseMessage";
import { validate as validateEmail } from "email-validator";
import ResponseCode from "../ResponseCode";
import bcrypt from "bcryptjs";
import { AdvancedConsoleLogger } from "typeorm";

@Controller("/user")
class UserController extends BaseController {

    @Get("/dashboard")
    async getDashboardData(@Response() res: express.Response, @Request() req: express.Request) {
        if(!req.user) {
            this.invalidToken(res);
            return;
        }


        res.json({
            type: ResponseType.Success,
            data: JSON.parse(req.user.dashboardData),
        });
    }

    @Post("/dashboard")
    async setDashboardData(@Request() req: express.Request, @Response() res: express.Response) {
        if(!req.user) {
            this.invalidToken(res);
            return;
        }

        req.user.dashboardData = JSON.stringify(req.body);
        await req.user.save();

        res.json({
            type: ResponseType.Success,
        });
    }


    @Get("/me")
    async me(@Response() res: express.Response, @Request() req: express.Request){
        if(!req.user) {
            this.invalidToken(res);
            return;
        }

        res.json({
            type: ResponseType.Success,
            code: ResponseCode.ME_OKAY,
            user: req.user?.withoutHiddenFields()
        });
    }

    @Get("/")
    async users(@Request() req: express.Request, @Response() res: express.Response) {
        if(!req.user?.isAdmin) {
            this.notEnoughPermissions(res);
            return;
        }

        const users = await User.find();

        res.json({
            type: ResponseType.Success,
            users: users.map(user => user.withoutHiddenFields())
        });
    }

    @Get("/:id")
    async user(@Request() req: express.Request, @Response() res: express.Response, @Params("id") id: string) {
        if(!req.user?.isAdmin) {
            this.notEnoughPermissions(res);
            return;
        }

        const user = await User.findOne({id});

        res.json({
            type: ResponseType.Success,
            user
        });
    }

    @Get("/delete/:id")
    async delete(@Request() req: express.Request, @Response() res: express.Response, @Params("id") id: string) {
        if(!req.user?.isAdmin) {
            this.notEnoughPermissions(res);
            return;
        }

        const user = await User.findOne({id});
        await user?.remove();

        res.json({
            type: ResponseType.Success,
        });
    }

    @Post("/update/:id")
    async update(@Request() req: express.Request, @Response() res: express.Response, @Params("id") id: string) {
        if(!req.user?.isAdmin) {
            this.notEnoughPermissions(res);
            return;
        }

        const user = await User.findOne({id});
        if(user) {
            user.email = req.body.email;
            user.username = req.body.username;
            user.firstName = req.body.firstName;
            user.lastName = req.body.lastName;
            user.isAdmin = req.body.isAdmin;
            user.changePasswordOnLogin = req.body.changePasswordOnLogin;
        }
        await user?.save();

        res.json({
            type: ResponseType.Success,
            user: user?.withoutHiddenFields(),
        });
    }

    @Post("/")
    async create(@Request() req: express.Request, @Response() res: express.Response) {
        if(!req.user?.isAdmin) {
            this.notEnoughPermissions(res);
            return;
        }

        console.timeLog(req.body);

        const {firstName, lastName, username, email, password, isAdmin, changePasswordOnLogin} = req.body;

        if(!firstName || !lastName || !username || !email || !password || typeof isAdmin !== "boolean" || typeof changePasswordOnLogin !== "boolean") {
            this.notEnoughParameters(res);
            return;
        }

        if(!validateEmail(email.toString())) {
            res.json({
                type: ResponseType.Error, 
                message: ResponseMessage.WRONG_EMAIL_FORMAT,
            });
            return;
        }

        const alreadyExistingUsername = await User.findOne({username: username.toString()});
        if(alreadyExistingUsername) {
            res.json({
                type: ResponseType.Error, 
                message: ResponseMessage.USERNAME_TAKEN,
            });
            return;
        }
        const alreadyExistingEmail = await User.findOne({email: email.toString()});
        if(alreadyExistingEmail) {
            res.json({
                type: ResponseType.Error, 
                message: ResponseMessage.EMAIL_TAKEN,
            });
            return;
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const user: User = User.create({
            firstName, 
            lastName, 
            username, 
            email, 
            isAdmin, 
            changePasswordOnLogin,
            passwordHash
        });

        await user.save();

        const loginToken = LoginToken.create();
        await loginToken.save();

        res.json({
            type: ResponseType.Success,
            message: ResponseMessage.REGISTER_OKAY,
            token: loginToken.token,
        });
    }
    

    

}

export default UserController;