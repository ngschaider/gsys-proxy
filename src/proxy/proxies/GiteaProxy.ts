import { IncomingMessage, ClientRequest, ServerResponse } from "http";
import Service, { ServiceType } from "../../models/Service";
import ProtectedProxy from "./ProtectedProxy";
import querystring from "querystring";
import { ServerOptions } from "http-proxy";
import { Socket } from "net";
import GiteaApi from "../../external_api/GiteaApi";
import cookieParser from "cookie-parser";
import cookie from "cookie";
import { replaceCookie } from "../../utils/cookies";
import { sendFile, ServerPage } from "../../utils/sendfile";

class GiteaProxy extends ProtectedProxy {

    constructor(service: Service) {
        super(service, {
            //selfHandleResponse: true,
        });
    }

    async web(req: IncomingMessage, res: ServerResponse) {
        if(req.url == "/user/logout") {
            res.setHeader("location", "/");
            res.end();
            return;
        }

        this.server.web(req, res);
    }

    async onProxyReq(proxyReq: ClientRequest, req: IncomingMessage, res: ServerResponse) {
        if(!req.serviceUser) {
            console.log("no service user found onProxyReq Gitea");
            return;
        }
        if(req.serviceUser.data.type !== ServiceType.Gitea) {
            console.log("GiteaProxy: Wrong ServiceUser Data Type");
            return;
        }

        await req.serviceUser.preRequest();

        const cookieName = GiteaApi.getSessionCookieName();

        const originalCookies = req.headers.cookie ?? "";
        proxyReq.setHeader("cookie", replaceCookie(originalCookies, cookieName, req.serviceUser?.data.token));
    }

}
export default GiteaProxy;