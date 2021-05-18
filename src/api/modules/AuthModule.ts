import { Express } from "express";
import User from "../../models/User";
import ApiModule, { RouteRegister } from "../ApiModule";
import bcrypt from "bcryptjs";
import LoginToken from "../../models/LoginToken";
import {validate as validateEmail} from "email-validator";

export default class AuthModule extends ApiModule {

    constructor() {
        super("/auth");   
    }

    registerRoutes(app: RouteRegister) {
        app.get("/login", async (req, res) => {
            const {usernameOrEmail, password} = req.query;
            if(!usernameOrEmail || !password) {
                res.json({
                    type: "error", 
                    message: "Nicht genügend Parameter!",
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
                        type: "success",
                        message: "Anmeldung erfolgreich!",
                        token: loginToken.token,
                    });
                    return;
                }
            }

            res.json({
                type: "error",
                message: "Benutzername oder Passwort falsch!",
            });
        });

        app.get("/register", async (req, res) => {
            const {firstName, lastName, username, email, password, passwordConfirm} = req.query;

            if(!firstName || !lastName || !username || !email || !password || !passwordConfirm) {
                res.json({
                    type: "error", 
                    message: "Nicht genügend Parameter!",
                });
                return;
            }

            if(password !== passwordConfirm) {
                res.json({
                    type: "error", 
                    message: "Passwörter stimmen nicht überein!",
                });
                return;
            }

            if(!validateEmail(email.toString())) {
                res.json({
                    type: "error", 
                    message: "E-Mail Adresse scheint nicht richtig zu sein!",
                });
                return;
            }

            const alreadyExistingUsername = await User.findOne({username: username.toString()});
            if(alreadyExistingUsername) {
                res.json({
                    type: "error", 
                    message: "Benutzername bereits vergeben!",
                });
                return;
            }
            const alreadyExistingEmail = await User.findOne({email: email.toString()});
            if(alreadyExistingEmail) {
                res.json({
                    type: "error", 
                    message: "Benutzer mit dieser E-Mail Adresse bereits vorhanden!",
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
                message: "Registrierung erfolgreich!",
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
                    type: "error",
                    message: "Token ungültig!",
                    code: "INVALID_TOKEN",
                });
                return;
            }
        });

        app.get("/logout", async (req, res) => {
            const token = req.cookies["GSYSAuthCookie"];

            if(!token) {
                res.json({
                    type: "error", 
                    message: "Nicht genügend Parameter!",
                });
                return;
            }

            const loginToken = await LoginToken.findOne({token});
            if(!loginToken) {
                res.json({
                    type: "error",
                    message: "Token ungültig!",
                    code: "INVALID_TOKEN",
                });
                return;
            }

            await loginToken.remove();

            res.json({
                type: "success",
                message: "Abmeldung erfolgreich!",
            });
        });


    }

}