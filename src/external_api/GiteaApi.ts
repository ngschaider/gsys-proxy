import request from "request-promise";
import querystring from "querystring";
import config from "../config";

class GiteaApi {

    static getSessionCookieName() {
        return "i_like_gitea";
    }

    // private static async getSessionCookieValue(host: string): Promise<string> {
    //     const res = await request(host, {
    //         ca: rootCa,
    //         simple: false,
    //         resolveWithFullResponse: true,
    //     });


    //     if(res.statusCode !== 200) {
    //         return Promise.reject("Invalid Status Code " + res.statusCode + ". Expected 200");
    //     }        

    //     if(!res.headers || !res.headers["set-cookie"]) {
    //         return Promise.reject("Could not find required set-cookie header");
    //     }

    //     const allSetCookies: string[] = res.headers["set-cookie"];
    //     const setCookie = allSetCookies.find(setCookie => setCookie.startsWith(this.getSessionCookieName()));

    //     if(!setCookie) {
    //         return Promise.reject("Could not find required set-cookie header " + this.getSessionCookieName());
    //     }

    //     const firstIndex = setCookie.indexOf("=");
    //     const lastIndex = setCookie.indexOf(";");

    //     const value = setCookie.substring(firstIndex + 1, lastIndex);

    //     return value;    
        
    // }

    // static async getLoggedInSession(host: string, username: string, password: string): Promise<string> {
    //     const cookieName = this.getSessionCookieName();
    //     const cookieValue = await this.getSessionCookieValue(host);

    //     const res = await request(host + "/user/login", {
    //         method: "POST",
    //         body: querystring.stringify({
    //             user_name: username,
    //             password: password,
    //         }),
    //         simple: false,
    //         ca: rootCa,
    //         resolveWithFullResponse: true,
    //     });
        
    //     if(res.statusCode !== 200) {
    //         return Promise.reject("Unexpected status code " + res.statusCode + ". Expected 200");
    //     }

    //     return cookieValue;
    // }


    static async getLoggedInSession(host: string, username: string, password: string): Promise<string> {
        const cookieName = this.getSessionCookieName();

        const res = await request(host + "/user/login", {
            method: "POST",
            body: querystring.stringify({
                user_name: username,
                password: password,
            }),
            headers: {
                "content-type": "application/x-www-form-urlencoded",
            },
            simple: false,
            ca: config.CA,
            resolveWithFullResponse: true,
        });
        
        /*if(res.statusCode !== 200) {
            return Promise.reject("Unexpected status code " + res.statusCode + ". Expected 200");
        }*/
        if(!res.headers || !res.headers["set-cookie"]) {
            return Promise.reject("Could not find required set-cookie header");
        }

        const allSetCookies: string[] = res.headers["set-cookie"];
        const setCookie = allSetCookies.find(setCookie => setCookie.startsWith(this.getSessionCookieName()));

        if(!setCookie) {
            return Promise.reject("Could not find required set-cookie header " + this.getSessionCookieName());
        }

        const firstIndex = setCookie.indexOf("=");
        const lastIndex = setCookie.indexOf(";");

        const value = setCookie.substring(firstIndex + 1, lastIndex);

        return value;
    }

}
export default GiteaApi;