import { Controller, Get, Params, Post, Request, Response } from "@decorators/express";
import express from "express";
import ResponseType from "../ResponseType";
import BaseController from "./BaseController";
import Service from "../../models/Service";

@Controller("/service")
class ServiceController extends BaseController {

    @Get("/")
    async all(@Request() req: express.Request, @Response() res: express.Response) {
        if(!req.user?.isAdmin) {
            this.notEnoughPermissions(res);
            return;
        }

        const services = await Service.find();

        res.json({
            type: ResponseType.Success,
            services: services.map(service => service.withoutHiddenFields())
        });
    }

    @Get("/delete/:id")
    async delete(@Request() req: express.Request, @Response() res: express.Response, @Params("id") id: string) {
        if(!req.user?.isAdmin) {
            this.notEnoughPermissions(res);
            return;
        }

        const service = await Service.findOne({id});

        if(!service) {
            this.serviceNotFound(res);
            return;
        }

        await service.remove();

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

        const service = await Service.findOne({id});
        if(!service) {
            this.serviceNotFound(res);
            return;
        }

        service.targetHost = req.body.targetHost || service.targetHost;
        service.targetPort = req.body.targetPort || service.targetPort;
        service.protocol = req.body.protocol || service.protocol;
        service.hostname = req.body.hostname || service.hostname;
        service.type = req.body.type || service.type;

        await service.save();

        res.json({
            type: ResponseType.Success,
            service: service.withoutHiddenFields(),
        });
    }

    @Post("/")
    async create(@Request() req: express.Request, @Response() res: express.Response) {
        if(!req.user?.isAdmin) {
            this.notEnoughPermissions(res);
            return;
        }

        const {id, hostname, targetHost, targetPort, protocol, type} = req.body;

        if(!id || !hostname || !targetHost || !targetPort || !protocol || !type) {
            this.notEnoughParameters(res);
            return;
        }

        const service = Service.create({
            id, hostname, targetHost, targetPort, protocol, type,
        });

        await service.save();

        res.json({
            type: ResponseType.Success,
            service: service.withoutHiddenFields(),
        });
    }

}

export default ServiceController;