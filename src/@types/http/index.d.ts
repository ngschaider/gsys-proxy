declare namespace Express {
    export interface Request {
        loginToken?: import("../../models/Session").default;
        user?: import("../../models/User").default;
        service?: import("../../models/Service").default;
        serviceUser?: import("../../models/ServiceUser").default;
    }
}
