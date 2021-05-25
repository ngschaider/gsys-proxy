import express from "express";
import { createConnection } from "typeorm";
import HttpApi from "./api/HttpApi";
import HttpProxy from "./HttpProxy";
import https from "https";
import fs from "fs";
import { bootstrap } from "global-agent";
import PveApi from "./pve/PveApi";

const main = async () => {
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
