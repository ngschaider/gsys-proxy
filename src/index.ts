import HttpApi from "./api/HttpApi";
import HttpProxy from "./HttpProxy";
import { bootstrap } from "global-agent";
import Service from "./models/Service";
import DataSource from "./DataSource";

const main = async () => {
    console.log("Starting...");

    // process.env.GLOBAL_AGENT_HTTP_PROXY="http://192.168.0.233:8080";
    // bootstrap();

    DataSource.initialize();
    console.log("Connected to Database!");

    const httpProxy = new HttpProxy();
    httpProxy.registerServices(await Service.find());
    await httpProxy.listen();
};

main();
