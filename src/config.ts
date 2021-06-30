import fs from "fs";
import { DatabaseType } from "typeorm";

if(process.env.NODE_ENV === "development") {
    process.env.PROXY_CERT_FILE = "certificates/dev.cer";
    process.env.PROXY_KEY_FILE = "certificates/dev.key";
    process.env.API_CERT_FILE = "certificates/dev.cer";
    process.env.API_KEY_FILE = "certificates/dev.key";
    process.env.CA_FILE = "certificates/ca.cer";
}

const proxyKeyFile = process.env.PROXY_KEY_FILE ?? "/data/proxy.key";
const proxyCertFile = process.env.PROXY_CERT_FILE ?? "/data/proxy.cer";
const apiKeyFile = process.env.API_KEY_FILE ?? "/data/api.key";
const apiCertFile = process.env.API_CERT_FILE ?? "/data/api.cer";
const caFile = process.env.CA_FILE ?? "/data/ca.cer";

const database: any = {
    "type": (process.env.DB_TYPE as DatabaseType) ?? "mariadb",
    "host": process.env.DB_HOST ?? "localhost",
    "username": process.env.DB_USERNAME ?? "root",
    "password": process.env.DB_PASSWORD ?? "root",
    "port": process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    "database": process.env.DB_NAME ?? "gsys-proxy",
    "synchronize": true,
    "entities": [
        __dirname + "/models/**/*.{ts,js}",
    ],
    "migrations": [
        __dirname + "/migrations/**/*.{ts,js}"
    ],
    "cli": {
        "entitiesDir": "./models",
        "migrationsDir": "./migrations"
    }
};

const config = {
    database,
    proxy: {
        PORT: parseInt(process.env.PROXY_PORT ?? "80"),
        PORT_SSL: parseInt(process.env.PROXY_PORT_SSL ?? "443"),
        CERT_FILE: proxyCertFile,
        CERT: process.env.PROXY_CERT ?? fs.readFileSync(proxyCertFile).toString(),
        KEY_FILE: proxyKeyFile,
        KEY: process.env.PROXY_KEY ?? fs.readFileSync(proxyKeyFile).toString(),
    },
    api: {
        PORT: parseInt(process.env.API_PORT ?? "8100"),
        KEY_FILE: apiKeyFile,
        KEY: process.env.API_KEY ?? fs.readFileSync(apiKeyFile).toString(),
        CERT_FILE: apiCertFile,
        CERT: process.env.API_KEY ?? fs.readFileSync(apiCertFile).toString(),
    },
    CA_FILE: caFile,
    CA: process.env.CA ?? fs.readFileSync(caFile).toString(),
    ACCOUNTS_URL: process.env.LOGIN_URL ?? "https://accounts.gsys.at/",
};


console.log("process.env.NODE_ENV=" + process.env.NODE_ENV);
// if(process.env.NODE_ENV === "development") {
//     const cert = fs.readFileSync("certificates/dev.cer").toString();
//     const key = fs.readFileSync("certificates/dev.key").toString();
//     config.proxy.CERT = cert;
//     config.proxy.KEY = key;
//     config.api.CERT = cert;
//     config.api.KEY = key;
//     config.CA = fs.readFileSync("certificates/ca.cer").toString();
// }

export default config;