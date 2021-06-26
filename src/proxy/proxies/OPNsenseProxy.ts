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
import OPNsenseApi from "../../external_api/OPNsenseApi";

class OPNsenseProxy extends ProtectedProxy {

    constructor(service: Service) {
        super(service, {
            //selfHandleResponse: true,
        });
    }

    async web(req: IncomingMessage, res: ServerResponse) {
        if(req.url === "/index.php?logout") {
            sendFile(res, ServerPage.Disabled);
            return;
        }
        this.server.web(req, res);
    }

    async onProxyReq(proxyReq: ClientRequest, req: IncomingMessage, res: ServerResponse) {
        if(!req.serviceUser) {
            console.log("no service user found onProxyReq OPNsense");
            return;
        }
        if(req.serviceUser.data.type !== ServiceType.OPNsense) {
            console.log("OPNsenseProxy: Wrong ServiceUser Data Type");
            return;
        }

        await req.serviceUser.preRequest();

        const originalCookies = req.headers.cookie ?? "";
        proxyReq.setHeader("cookie", replaceCookie(originalCookies, "PHPSESSID", req.serviceUser?.data.token));
    }

}
export default OPNsenseProxy;