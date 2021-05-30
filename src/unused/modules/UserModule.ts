import { Express } from "express";
import User from "../../models/User";
import ApiModule, { RouteRegister } from "../ApiModule";
import bcrypt from "bcryptjs";
import LoginToken from "../../models/LoginToken";
import {validate as validateEmail} from "email-validator";
import ResponseType from "../ResponseType";
import ResponseMessage from "../ResponseMessage";



export default class UserModule extends ApiModule {

    constructor() {
        super("/user");   
    }

    registerRoutes(app: RouteRegister) {
        
    }

}