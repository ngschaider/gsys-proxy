import fs from "fs";
import http from "http";
import https from "https";
import Service, { ServiceType } from "../models/Service";
import { IncomingMessage, ServerResponse } from "http";
import Proxy from "./proxies/TransparentProxy";
import TransparentProxy from "./proxies/TransparentProxy";
import PhpMyAdminProxy from "./proxies/GiteaProxy";
import PveProxy from "./proxies/PveProxy";
import cookie from "cookie";
import LoginToken from "../models/LoginToken";
import formfill from "../utils/formfill";
import GiteaProxy from "./proxies/GiteaProxy";
import ServiceUser from "../models/ServiceUser";
import OPNsenseProxy from "./proxies/OPNsenseProxy";
import { sendFile, ServerPage } from "../utils/sendfile";
import config from "../config";

export default class HttpProxy {

    httpsServer: https.Server;
    httpServer: http.Server;
    proxies: Proxy[] = [];
    
    constructor() {    
        const credentials = {
            key: config.proxy.KEY,
            cert: config.proxy.CERT,
        }
        
        this.httpsServer = https.createServer(credentials, async (req, res) => {
            await this.setUser(req);
            await this.proxyWeb(req, res);

            if(!req.handledByProxy) {
                sendFile(res, ServerPage.NotFound);
            }
        });

        this.httpServer = http.createServer(async (req, res) => {
            res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
            res.end();
        });

        this.httpsServer.on("upgrade", async (req, socket, head) => {
            await this.setUser(req);
            await this.proxyWs(req, socket, head);
        });
    }

    async setUser(req: IncomingMessage) {
        if(!req.headers.cookie) return;

        const cookies = cookie.parse(req.headers.cookie);
        const token = cookies.GSYSAuthCookie;
        if(!token) return;

        req.loginToken = await LoginToken.findOne({token});    
        if(!req.loginToken) return;

        req.user = req.loginToken.user;
    }

    async setServiceUser(req: IncomingMessage, service: Service) {
        if(!req.user) return;

        req.service = service;
        // console.log("looking for service user for service " + req.service.id);
        // console.log("got " + req.user.serviceUsers.length + " service users for this user");
        const serviceUser = await ServiceUser.findOne({
            where: {
                service: {
                    id: req.service.id,
                }
            }
        });

        req.serviceUser = serviceUser;
        // req.serviceUser = req.user.serviceUsers.find(async serviceUser => {
        //     const service2 = await serviceUser.service;

        //     // const format = service2 === service ? "MATCH" : "not matching";
        //     // console.log("    - Comparison for ServiceUser " + serviceUser.id + " results in: " + format);

        //     return service2.id === service.id;
        // });
    }

    registerService(service: Service) {
        if(service.type === ServiceType.Transparent) {
            this.proxies.push(new TransparentProxy(service));
        } else if(service.type === ServiceType.PVE) {
            this.proxies.push(new PveProxy(service));
        } else if(service.type === ServiceType.Gitea) {
            this.proxies.push(new GiteaProxy(service));
        } else if(service.type === ServiceType.OPNsense) {
            this.proxies.push(new OPNsenseProxy(service));
        }
    }
    
    registerServices(services: Service[]) {
        for(const service of services) {
            this.registerService(service);
        }
    }

    async proxyWeb(req: IncomingMessage, res: ServerResponse) {
        for(const proxy of this.proxies) {
            if(proxy.relevant(req)) {
                await this.setServiceUser(req, proxy.service);
                proxy.web(req, res);
                req.handledByProxy = true;
                return;
            }
        }
    }
    
    async proxyWs(req: any, socket: any, head: any) {
        for(const proxy of this.proxies) {
            if(proxy.relevant(req)) {
                await this.setServiceUser(req, proxy.service);
                proxy.ws(req, socket, head);
                req.handledByProxy = true;
                return;
            }
        }
    }

    async listen() {
        await new Promise<void>(resolve => {
            this.httpServer.listen(config.proxy.PORT, resolve);
        });
        console.log("Insecure Proxy listening on Port " + config.proxy.PORT);

        await new Promise<void>(resolve => {
            this.httpsServer.listen(config.proxy.PORT_SSL, resolve);
        }); 

        console.log("Secure Proxy listening on Port " + config.proxy.PORT_SSL);
    }

}