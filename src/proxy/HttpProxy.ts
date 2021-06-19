import fs from "fs";
import https from "https";
import Service, { ServiceType } from "../models/Service";
import { IncomingMessage, ServerResponse } from "http";
import Proxy from "./proxies/TransparentProxy";
import TransparentProxy from "./proxies/TransparentProxy";
import PhpMyAdminProxy from "./proxies/PhpMyAdminProxy";
import PveProxy from "./proxies/PveProxy";
import cookie from "cookie";
import LoginToken from "../models/LoginToken";
import formfill from "../utils/formfill";

export default class HttpProxy {

    port: number = 443;
    httpsServer: https.Server;
    proxies: Proxy[] = [];
    
    constructor() {    
        const credentials = {
            key: fs.readFileSync("certificates/proxy.key"),
            cert: fs.readFileSync("certificates/proxy.crt"),
        }
        
        this.httpsServer = https.createServer(credentials, async (req, res) => {
            await this.setUser(req);
            await this.proxyWeb(req, res);

            if(!req.handledByProxy) {
                res.statusCode = 404;
                res.write("<center><h1>404 - Not Found</h1></center>");
                res.end();
            }
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
        req.serviceUser = req.user.serviceUsers.find(async serviceUser => {
            const service2 = await serviceUser.service;
            return service2 === service;
        });
    }

    registerService(service: Service) {
        if(service.type === ServiceType.Transparent) {
            this.proxies.push(new TransparentProxy(service));
        } else if(service.type === ServiceType.PVE) {
            this.proxies.push(new PveProxy(service));
        } else if(service.type === ServiceType.PhpMyAdmin) {
            this.proxies.push(new PhpMyAdminProxy(service));
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
            this.httpsServer?.listen(this.port, resolve);
        }); 

        console.log("Proxy listening on Port " + this.port);
    }

}