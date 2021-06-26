import request from "request-promise";
import {rootCa} from "../utils/certificates";

class PveApi {

    static async isValidToken(host: string, token: string): Promise<boolean> {
        const res = await request(host + "/api2/json", {
            headers: {
                cookies: {
                    PVEAuthCookie: token + "aa",
                }
            },
            resolveWithFullResponse: true,
            ca: rootCa,
            simple: false,
        });

        return res.statusCode !== 401;
    }

    static async getNewTicket(host: string, username: string, password: string): Promise<string|null> {
        const res = await request(host + "/api2/json/access/ticket", {
            method: "POST",
            body: "username=" + username + "&password=" + password,
            simple: false,
            ca: rootCa,
            resolveWithFullResponse: true,
        });
        
        if(res.statusCode === 401) {
            return null;
        }

        const data = JSON.parse(res.body);

        return data?.data?.ticket || null;
    }

}
export default PveApi;