import { Controller, Get, Params, Response, Request, Query } from "@decorators/express";
import express from "express";
import request from "request-promise";
import LoginToken from "../../models/LoginToken";
import User from "../../models/User";
import ResponseMessage from "../ResponseMessage";
import ResponseType from "../ResponseType";
import bcrypt from "bcryptjs";
import BaseController from "./BaseController";
import {validate as validateEmail} from "email-validator";
import ResponseCode from "../ResponseCode";
import { ServiceType } from "../../models/Service";
import PveApi from "../../external_api/PveApi";
import config from "../../config";

@Controller("/spice")
class SpiceController extends BaseController {

    @Get("/connect")
    async connect(@Response() res: express.Response, @Request() req: express.Request) {
        const {id} = req.query;
        if(!id) {
            console.log("No ID");
            this.notEnoughParameters(res);
            return;
        };

        if(!req.user) {
            console.log("No User");
            this.invalidToken(res);
            return;
        }

        const serviceUser = req.user.serviceUsers.find(async (serviceUser) => {
            const service = await serviceUser.service;
            return service.type === ServiceType.PVE;
        });
        if(!serviceUser) {
            console.log("No Service User");
            this.notEnoughPermissions(res);
            return;
        }

        const service = await serviceUser.service;
        if(!service) {
            console.log("No Service");
            this.notEnoughPermissions(res);
            return;
        }
        if(serviceUser.data.type !== ServiceType.PVE) {
            console.log("Wrong Data Type");
            return;
        }

        const address = service.protocol + "://" + service.targetHost + ":" + service.targetPort;

        //if we dont have a token or the saved token is older than 2 hours, request a new token and save it
        await serviceUser.preRequest();
        if(!serviceUser.data.token) {
            this.notEnoughPermissions(res);
            return;
        }

        const result = await request(address + "/api2/extjs/nodes/xenon/qemu/" + id + "/spiceproxy", {
            method: "POST",
            headers: {
                Cookie: "PVEAuthCookie=" + encodeURIComponent(serviceUser.data.token),
                CSRFPreventionToken: serviceUser.data.csrf,
            },
            resolveWithFullResponse: true,
            ca: config.CA,
            simple: false,
            form: {
                proxy: service.targetHost
            },
            rejectUnauthorized: false,
            proxy: "http://192.168.0.233:8080",
        });

        const json = JSON.parse(result.body);

        const raw = "[virt-viewer]\n" + Object.entries(json.data).map(([key, value]) => {
            return key + "=" + value;
        }).join("\n");

        res.setHeader("Content-Type", "application/x-virt-viewer");
        res.setHeader("Content-Disposition", "attachment; filename=\"gsys.vv\"");

        res.send(raw);
    }

}

export default SpiceController;