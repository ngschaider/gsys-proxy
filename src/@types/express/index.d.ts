import LoginToken from "../../models/LoginToken";
import Service from "../../models/Service";
import User from "../../models/User";
import Service from "../../models/Service";
import ServiceUser from "../../models/ServiceUser";

declare module 'http' {
    interface IncomingMessage {
        loginToken?: LoginToken;
        user?: User;
        service?: Service;
        serviceUser?: ServiceUser;
        handledByProxy: boolean;
    }
}