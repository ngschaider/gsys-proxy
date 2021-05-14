import { Express } from "express";
import User from "../../models/User";
import ApiModule, { RouteRegister } from "../ApiModule";
import bcrypt from "bcryptjs";
import LoginToken from "../../models/LoginToken";

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
                const valid = await bcrypt.compare(password as string, user.passwordHash);

                const loginToken = LoginToken.create();
                await loginToken.save();

                if(valid) {
                    res.json({
                        type: "success",
                        message: "Anmeldung erfolgreich!",
                        loginToken: loginToken.token,
                    });
                }
            }

            res.json({
                type: "error",
                message: "Benutzername oder Passwort falsch!",
            });
        });

        app.get("/me", async (req, res) => {
            const {token} = req.query;

            if(!token) {
                res.json({
                    type: "error", 
                    message: "Nicht genügend Parameter!",
                });
            }

            const loginToken = await LoginToken.findOne({where: {token}});
            if(loginToken) {
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
            } else {
                res.json({
                    type: "error",
                    message: "Token ungültig!",
                });
            }
        });

        app.get("/logout", async (req, res) => {
            const {token} = req.query;

            if(!token) {
                res.json({
                    type: "error", 
                    message: "Nicht genügend Parameter!",
                });
            }

            const loginToken = await LoginToken.findOne({where: token});
            if(!loginToken) {
                res.json({
                    type: "error",
                    message: "Token ungültig!",
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