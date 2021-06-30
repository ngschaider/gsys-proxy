import request from "request-promise";
import config from "../config";

export type TokenResponse = {
    csrf: string;
    token: string;
}

class PveApi {

    static async isValidToken(host: string, token: string): Promise<boolean> {
        const res = await request(host + "/api2/json", {
            headers: {
                cookies: {
                    PVEAuthCookie: token,
                }
            },
            resolveWithFullResponse: true,
            ca: config.CA,
            simple: false,
        });

        return res.statusCode !== 401;
    }

    static async getNewTicket(host: string, username: string, password: string): Promise<TokenResponse> {
        const res = await request(host + "/api2/json/access/ticket", {
            method: "POST",
            body: "username=" + username + "&password=" + password,
            simple: false,
            ca: config.CA,
            resolveWithFullResponse: true,
        });
        
        if(res.statusCode === 401) {
            return Promise.reject("Status Code " + res.statusCode);
        }

        const data = JSON.parse(res.body);

        if(data.data) {
            return  {
                token: data.data.ticket,
                csrf: data.data.CSRFPreventionToken,
            };
        } else {
            return Promise.reject(data);
        }
    }

}
export default PveApi;