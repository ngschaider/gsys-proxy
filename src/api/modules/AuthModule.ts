import { Express } from "express";
import User from "../../models/User";
import ApiModule, { RouteRegister } from "../ApiModule";
import bcrypt from "bcryptjs";
import LoginToken from "../../models/LoginToken";
import {validate as validateEmail} from "email-validator";

enum ResponseType {
    Error = "error",
    Success = "success",
}

enum ResponseMessage {
    INVALID_TOKEN = "Token ungültig!",
    NOT_ENOUGH_PARAMETERS = "Not enough parameters!",
    LOGIN_OKAY = "Anmeldung erfolgreich!",
    REGISTER_OKAY = "Registrierung erfolgreich!",
    WRONG_CREDENTIALS = "Benutzername oder Passwort falsch!",
    PASSWORDS_NOT_MATCHING = "Passwörter stimmen nicht überein!",
    WRONG_EMAIL_FORMAT = "E-Mail Adresse scheint nicht richtig zu sein!",
    USERNAME_TAKEN = "Benutzername bereits vergeben!",
    EMAIL_TAKEN = "Benutzer mit dieser E-Mail Adresse bereits vorhanden!",
    LOGOUT_OKAY = "Abmeldung erfolgreich!",
}

enum ResponseCode {
    LOGIN_OKAY = "CHANGE_PASSWORD",
    CHANGE_PASSWORD = "CHANGE_PASSWORD",
    REGISTER_OKAY = "REGISTER_OKAY",
    INVALID_TOKEN = "INVALID_TOKEN",
    LOGOUT_OKAY = "LOGOUT_OKAY",
}

export default class AuthModule extends ApiModule {

    constructor() {
        super("/auth");   
    }

    registerRoutes(app: RouteRegister) {
        app.get("/login", async (req, res) => {
            const {usernameOrEmail, password} = req.query;
            if(!usernameOrEmail || !password) {
                res.json({
                    type: ResponseType.Error, 
                    message: ResponseMessage.NOT_ENOUGH_PARAMETERS,
                });
                return;
            };

            const where = usernameOrEmail.toString().includes("@") ? {email: usernameOrEmail} : {username: usernameOrEmail};
            const user = await User.findOne({where});

            if(user) {
                const valid = await bcrypt.compare(password.toString(), user.passwordHash);

                const loginToken = LoginToken.create();
                loginToken.user = user;
                await loginToken.save();

                if(valid) {
                    res.json({
                        type: ResponseType.Success,
                        message: ResponseMessage.LOGIN_OKAY,
                        token: loginToken.token,
                    });
                    return;
                }
            }

            res.json({
                type: ResponseType.Error,
                message: ResponseMessage.WRONG_CREDENTIALS,
            });
        });

        app.get("/register", async (req, res) => {
            const {firstName, lastName, username, email, password, passwordConfirm} = req.query;

            if(!firstName || !lastName || !username || !email || !password || !passwordConfirm) {
                res.json({
                    type: ResponseType.Error, 
                    message: ResponseMessage.NOT_ENOUGH_PARAMETERS,
                });
                return;
            }

            if(password !== passwordConfirm) {
                res.json({
                    type: ResponseType.Error, 
                    message: ResponseMessage.PASSWORDS_NOT_MATCHING,
                });
                return;
            }

            if(!validateEmail(email.toString())) {
                res.json({
                    type: ResponseType.Error, 
                    message: ResponseMessage.WRONG_EMAIL_FORMAT,
                });
                return;
            }

            const alreadyExistingUsername = await User.findOne({username: username.toString()});
            if(alreadyExistingUsername) {
                res.json({
                    type: ResponseType.Error, 
                    message: ResponseMessage.USERNAME_TAKEN,
                });
                return;
            }
            const alreadyExistingEmail = await User.findOne({email: email.toString()});
            if(alreadyExistingEmail) {
                res.json({
                    type: ResponseType.Error, 
                    message: ResponseMessage.EMAIL_TAKEN,
                });
                return;
            }

            const passwordHash = await bcrypt.hash(password as string, 12);

            const user: User = User.create({
                firstName: firstName.toString(),
                lastName: lastName.toString(),
                username: username.toString(),
                email: email.toString(),
                passwordHash
            });

            await user.save();

            const loginToken = LoginToken.create();
            await loginToken.save();

            res.json({
                type: "success",
                message: ResponseMessage.REGISTER_OKAY,
                token: loginToken.token,
            });
            return;
        });

        app.get("/me", async (req, res) => {
            const token = req.cookies["GSYSAuthCookie"];
            if(!token) {
                res.json({
                    type: "error", 
                    message: "Nicht genügend Parameter!",
                });
                return;
            }

            const loginToken = await LoginToken.findOne({where: {token}});
            if(loginToken && loginToken.user) {
                const {firstName, lastName, email, username} = loginToken.user;
                res.json({
                    type: "success",
                    user: {
                        firstName,
                        lastName,
                        email,
                        username,
                    }
                });
                return;
            } else {
                res.json({
                    type: ResponseType.Error,
                    message: ResponseMessage.INVALID_TOKEN,
                    code: ResponseCode.INVALID_TOKEN,
                });
                return;
            }
        });

        app.get("/logout", async (req, res) => {
            const token = req.cookies["GSYSAuthCookie"];

            if(!token) {
                res.json({
                    type: ResponseType.Error, 
                    message: ResponseMessage.NOT_ENOUGH_PARAMETERS,
                });
                return;
            }

            const loginToken = await LoginToken.findOne({token});
            if(!loginToken) {
                res.json({
                    type: ResponseType.Error,
                    code: ResponseCode.INVALID_TOKEN,
                    message: ResponseMessage.INVALID_TOKEN,
                });
                return;
            }

            await loginToken.remove();

            res.json({
                type: ResponseType.Success,
                code: ResponseCode.LOGOUT_OKAY,
                message: ResponseMessage.LOGOUT_OKAY,
            });
        });


    }

}