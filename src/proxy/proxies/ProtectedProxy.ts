import { IncomingMessage } from "http";
import { ServerResponse } from "http";
import { Socket } from "net";
import Proxy from "./TransparentProxy";

class ProtectedProxy extends Proxy {

    web(req: IncomingMessage, res: ServerResponse) {
        if(req.user) {
            if(req.serviceUser) {
                super.web(req, res);
            } else {
                res.write("<center><h1>403 - Forbidden</h1></center>");
                res.end();
            }
        } else {
            const origin = "https://" + req.headers.host + (req.url as string); // a request created by http.Server always has an URL.

            res.statusCode = 302; // 302 - Found
            res.setHeader("location", "https://accounts.gsys.at/login?origin=" + encodeURIComponent(origin));
            res.end();
        }
    }

    ws(req: IncomingMessage, socket: Socket, head: Buffer) {
        if(req.serviceUser) {
            super.ws(req, socket, head); 
        }
    }

}
export default ProtectedProxy;