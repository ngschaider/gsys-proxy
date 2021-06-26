import { IncomingMessage, ClientRequest, ServerResponse } from "http";
import Service, { ServiceType } from "../../models/Service";
import ProtectedProxy from "./ProtectedProxy";
import querystring from "querystring";
import { ServerOptions } from "http-proxy";
import { Socket } from "net";

class PveProxy extends ProtectedProxy {

    constructor(service: Service) {
        super(service, {
            //selfHandleResponse: true,
        });
    }

    async onProxyReq(proxyReq: ClientRequest, req: IncomingMessage, res: ServerResponse) {
        if(!req.serviceUser) {
            console.log("no service user found onProxyReq PVE");
            return;
        }
        if(req.serviceUser.data.type !== ServiceType.PVE) {
            console.log("PveProxy: Wrong ServiceUser Data Type");
            // console.log("ServiceUser ID: " + req.serviceUser.id);
            // console.log("Service ID: " + req.service?.id);
            return;
        }

        await req.serviceUser.preRequest();

        proxyReq.setHeader("cookie", "PVEAuthCookie=" + req.serviceUser?.data.token);

        if(req.url === "/api2/json/access/ticket") {
            // intercept the credentials when requesting a new ticket
            // (the pve client requests a new token when the current token is nearly expired)
            const bodyData = querystring.stringify({
                username: req.serviceUser.data.username + "@" + req.serviceUser.data.realm,
                password: req.serviceUser.data.token,
            });
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        } else if(req.url?.includes("spiceproxy") || req.url?.includes("spiceshell")) {
            // rewrite the proxy field so virt-viewer connects directly to pve
            // (we do not proxy on spice ports)
            const bodyData = querystring.stringify({
                proxy: req.service?.targetHost,
            });
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }
    }

    async onProxyRes(proxyRes: IncomingMessage, req: IncomingMessage, res: ServerResponse) {
        if(req.url === "/") {
            // set a bogus cookie so the client thinks it is logged in.
            res.setHeader("set-cookie", "PVEAuthCookie=InterceptedByProxy; Secure");
        } 
    }

    async onProxyReqWs(proxyReq: ClientRequest, req: IncomingMessage, socket: Socket, options: ServerOptions, head: Buffer) {
        console.log("PveProxy received WebSocket Upgrade Connection!");

        if(!req.serviceUser){
            console.log("websocket request without serviceUser");
            return;
        }
        if(req.serviceUser.data.type !== ServiceType.PVE) {
            console.log("Service User Data has wrong type");
            return;
        }

        await req.serviceUser.preRequest();
        proxyReq.setHeader("cookie", "PVEAuthCookie=" + req.serviceUser.data.token);
    }

}
export default PveProxy;