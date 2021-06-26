import request from "request-promise";
import {rootCa} from "../utils/certificates";
import querystring from "querystring";

class OPNsenseApi {

    static async getSessionAndCsrf(host: string) {
        const res = await request(host, {
            simple: false,
            ca: rootCa,
            resolveWithFullResponse: true,
        });
        
        if(res.statusCode !== 200) {
            return Promise.reject("Unexpected status code " + res.statusCode + ". Expected 200");
        }
        
        const body = res.body as string;

        const searchNameStart = '<input type="hidden" name="';
        const searchValueStart = '" value="';
        const searchValueEnd = '" autocomplete="new-password" />';
        const nameStartIndex = body.indexOf(searchNameStart) + searchNameStart.length;
        const nameEndIndex = body.indexOf(searchValueStart, nameStartIndex);

        const valueStartIndex = nameEndIndex + searchValueStart.length;
        const valueEndIndex = body.indexOf(searchValueEnd, valueStartIndex);

        const csrfName = body.substring(nameStartIndex, nameEndIndex);
        const csrfValue = body.substring(valueStartIndex, valueEndIndex);
        
        const allSetCookies: string[] = res.headers["set-cookie"];
        const setCookiePhpsessid = allSetCookies.find(setCookie => setCookie.startsWith("PHPSESSID"));
        if(!setCookiePhpsessid) {
            return Promise.reject("Could not find required set-cookie header PHPSESSID");
        }
        const firstIndex = setCookiePhpsessid.indexOf("=");
        const lastIndex = setCookiePhpsessid.indexOf(";");

        const phpsessid = setCookiePhpsessid.substring(firstIndex + 1, lastIndex);

        return {
            phpsessid,
            csrfName,
            csrfValue
        };
    }

    static async getLoggedInSession(host: string, username: string, password: string): Promise<string> {
        const {phpsessid, csrfName, csrfValue} = await this.getSessionAndCsrf(host);

        console.log("using PHPSESSID = " + phpsessid);

        console.log("got csrf name " + csrfName);
        console.log("got csrf value " + csrfValue);

        const res = await request(host, {
            headers: {
                Cookie: "PHPSESSID=" + phpsessid,
                "Content-Type": "application/x-www-form-urlencoded",
                "Host": "192.168.0.1"
            },
            body: querystring.stringify({
                [csrfName]: csrfValue,
                usernamefld: username,
                passwordfld: password,
                login: 1,
            }),
            method: "post",
            simple: false,
            ca: rootCa,
            resolveWithFullResponse: true,
            followRedirect: false,
        });
        
        if(res.statusCode !== 302) {
            return Promise.reject("Unexpected status code " + res.statusCode + ". Expected 302. OPNsenseAPI 2nd request");
        }

        const allSetCookies: string[] = res.headers["set-cookie"];
        const setCookiePhpsessid = allSetCookies.find(setCookie => setCookie.startsWith("PHPSESSID"));
        if(!setCookiePhpsessid) {
            return Promise.reject("Could not find required set-cookie header PHPSESSID");
        }
        const firstIndex = setCookiePhpsessid.indexOf("=");
        const lastIndex = setCookiePhpsessid.indexOf(";");

        const phpsessid2 = setCookiePhpsessid.substring(firstIndex + 1, lastIndex);

        return phpsessid2;
    }

}
export default OPNsenseApi;