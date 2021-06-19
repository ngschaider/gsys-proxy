import { IncomingMessage, ClientRequest, ServerResponse } from "http";
import Service from "../../models/Service";
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
        await req.serviceUser?.preRequest();
        proxyReq.setHeader("cookie", "PVEAuthCookie=" + req.serviceUser?.data.token);

        if(req.url === "/api2/json/access/ticket") {
            // intercept the credentials when requesting a new ticket
            // (the pve client requests a new token when the current token is nearly expired)
            const bodyData = querystring.stringify({
                username: req.serviceUser?.username,
                password: req.serviceUser?.data.token,
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
        // const data: Buffer[] = [];
        // proxyRes.on("data", data.push);

        if(req.url === "/") {
            // set a bogus cookie so the client thinks it is logged in.
            res.setHeader("set-cookie", "PVEAuthCookie=InterceptedByProxy; Secure");
        } 
        // else if(req.url?.includes("pvemanagerlib")) {
        //     proxyRes.on("end", () => {
        //         const newBody = Buffer.concat(data).toString().replace(`
        //         '-',
        //         {
        //             iconCls: 'fa fa-fw fa-sign-out',
        //             text: gettext("Logout"),
        //             handler: function() {
        //             PVE.data.ResourceStore.loadData([], false);
        //             me.showLogin();
        //             me.setContent(null);
        //             var rt = me.down('pveResourceTree');
        //             rt.setDatacenterText(undefined);
        //             rt.clearTree();
    
        //             // empty the stores of the StatusPanel child items
        //             var statusPanels = Ext.ComponentQuery.query('pveStatusPanel grid');
        //             Ext.Array.forEach(statusPanels, function(comp) {
        //                 if (comp.getStore()) {
        //                 comp.getStore().loadData([], false);
        //                 }
        //             });
        //             },
        //         },`, "");
        //         res.write(Buffer.from(newBody));
        //         res.end();
        //     });
        // }

        // proxyRes.pipe(res);
        // proxyRes.on("end", () => {
        //     res.end();
        // });
    }

    async onProxyReqWs(proxyReq: ClientRequest, req: IncomingMessage, socket: Socket, options: ServerOptions, head: Buffer) {
        console.log("PveProxy received WebSocket Upgrade Connection!");

        await req.serviceUser?.preRequest();
        proxyReq.setHeader("cookie", "PVEAuthCookie=" + req.serviceUser?.data.token);
    }

}
export default PveProxy;