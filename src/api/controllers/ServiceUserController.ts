import { Controller, Get, Params, Post, Request, Response } from "@decorators/express";
import express from "express";
import User from "../../models/User";
import ResponseType from "../ResponseType";
import BaseController from "./BaseController";
import LoginToken from "../../models/LoginToken";
import ResponseMessage from "../ResponseMessage";
import { validate as validateEmail } from "email-validator";
import ResponseCode from "../ResponseCode";
import bcrypt from "bcryptjs";
import ServiceUser from "../../models/ServiceUser";
import Service, { ServiceType } from "../../models/Service";

@Controller("/serviceUser")
class ServiceUserController extends BaseController {

    @Get("/")
    async all(@Request() req: express.Request, @Response() res: express.Response) {
        if(!req.user?.isAdmin) {
            this.notEnoughPermissions(res);
            return;
        }

        const serviceUsers = await ServiceUser.find();

        const serviceUsersData: any[] = [];
        for(const serviceUser of serviceUsers) {
            const data = await serviceUser.withoutHiddenFields();
            serviceUsersData.push(data);
        }

        res.json({
            type: ResponseType.Success,
            serviceUsers: serviceUsersData
        });
    }

    @Get("/:id")
    async forUser(@Request() req: express.Request, @Response() res: express.Response, @Params("id") id: string) {
        if(!req.user?.isAdmin) {
            this.notEnoughPermissions(res);
            return;
        }

        const user = await User.findOne({id});
        if(!user) {
            this.userNotFound(res);
            return;
        }

        const serviceUsersData: any[] = [];
        for(const serviceUser of user.serviceUsers) {
            const data = await serviceUser.withoutHiddenFields();
            serviceUsersData.push(data);
        }


        res.json({
            type: ResponseType.Success,
            serviceUsers: serviceUsersData,
        });
    }

    @Get("/delete/:id")
    async delete(@Request() req: express.Request, @Response() res: express.Response, @Params("id") id: string) {
        if(!req.user?.isAdmin) {
            this.notEnoughPermissions(res);
            return;
        }

        const serviceUser = await ServiceUser.findOne({id});

        if(!serviceUser) {
            this.serviceUserNotFound(res);
            return;
        }

        await serviceUser.remove();

        res.json({
            type: ResponseType.Success,
        });
    }

    @Post("/:id")
    async update(@Request() req: express.Request, @Response() res: express.Response, @Params("id") id: string) {
        if(!req.user?.isAdmin) {
            this.notEnoughPermissions(res);
            return;
        }

        const serviceUser = await ServiceUser.findOne({id});
        if(!serviceUser) {
            this.serviceUserNotFound(res);
            return;
        }

        if(req.body.serviceId) {
            const service = await Service.findOne({id: req.body.serviceId});
            if(!service) {
                this.serviceNotFound(res);
                return;
            }
            serviceUser.service = Promise.resolve(service);
        }

        serviceUser.data = req.body.data || serviceUser.data;

        await serviceUser.save();

        res.json({
            type: ResponseType.Success,
            serviceUser: serviceUser,
        });
    }

    @Post("/")
    async create(@Request() req: express.Request, @Response() res: express.Response) {
        if(!req.user?.isAdmin) {
            this.notEnoughPermissions(res);
            return;
        }

        const {serviceId, username, password, userId} = req.body;

        if(!serviceId || !username || !password || !userId) {
            this.notEnoughParameters(res);
            return;
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const serviceUser: ServiceUser = ServiceUser.create({
            data: {
                username,
                password,
            }
        });

        const service = await Service.findOne({id: serviceId});
        if(!service) {
            this.serviceNotFound(res);
            return;
        }
        serviceUser.service = Promise.resolve(service);

        const user = await User.findOne({id: userId});
        if(!user) {
            this.userNotFound(res);
            return;
        }
        serviceUser.user = Promise.resolve(user);

        await serviceUser.save();

        res.json({
            type: ResponseType.Success,
            serviceUser,
        });
    }
    

    

}

export default ServiceUserController;