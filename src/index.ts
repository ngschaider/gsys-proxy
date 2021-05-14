import express from "express";
import { createConnection } from "typeorm";
import HttpApi from "./api/HttpApi";
import Proxy from "./HttpProxy";
import https from "https";
import fs from "fs";
import { bootstrap } from "global-agent";

const main = async () => {
    process.env.GLOBAL_AGENT_HTTP_PROXY = "http://192.168.0.233:8080";
    bootstrap();


    process.env.NODE_EXTRA_CA_CERTS = __dirname + "/certificates/root_ca.cer";

    // add the Root CA to the https agent
    /*https.globalAgent.options.ca = [
        fs.readFileSync("certificates/root_ca.cer"),
    ];*/

    await createConnection();
    console.log("Conntected to Database!");

    const httpApi = new HttpApi();
    httpApi.registerRoutes();
    await httpApi.listen();

    const proxy = new Proxy();
    proxy.registerRoutes();
    await proxy.listen();
};
main();