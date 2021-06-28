import express from "express";
import { createConnection } from "typeorm";
import HttpApi from "./api/HttpApi";
import HttpProxy from "./proxy/HttpProxy";
import https from "https";
import fs from "fs";
import PveApi from "./external_api/PveApi";
import { bootstrap } from "global-agent";
import Service from "./models/Service";
import config from "./config";

const main = async () => {
    // process.env.GLOBAL_AGENT_HTTP_PROXY="http://192.168.0.233:8080";
    // bootstrap();

    await createConnection(config.database);
    console.log("Connected to Database!");

    const httpApi = new HttpApi();
    httpApi.registerRoutes();
    await httpApi.listen();

    const httpProxy = new HttpProxy();
    httpProxy.registerServices(await Service.find());
    await httpProxy.listen();
};

main();
