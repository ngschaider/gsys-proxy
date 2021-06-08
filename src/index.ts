import express from "express";
import { createConnection } from "typeorm";
import HttpApi from "./api/HttpApi";
import HttpProxy from "./HttpProxy";
import https from "https";
import fs from "fs";
import PveApi from "./pve/PveApi";
import { bootstrap } from "global-agent";

const main = async () => {
    process.env.GLOBAL_AGENT_HTTP_PROXY="http://192.168.0.233:8080";
    bootstrap();

    await createConnection();
    console.log("Connected to Database!");

    const httpApi = new HttpApi();
    httpApi.registerRoutes();
    await httpApi.listen();

    const httpProxy = new HttpProxy();
    httpProxy.registerRoutes();
    await httpProxy.listen();
};
main();
