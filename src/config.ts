import fs from "fs";

const database: any = {
    type: "mariadb",
    host: "localhost",
    username: "root",
    password: "root",
    port: 3306,
    database: "gsys_proxy",
    synchronize: true,
    entities: [
        __dirname + "/models/**/*.{ts,js}",
    ],
    migrations: [
        __dirname + "/migrations/**/*.{ts,js}"
    ],
    cli: {
        entitiesDir: "./models",
        migrationsDir: "./migrations"
    }
};

const config = {
    database,
    proxy: {
        PORT: 80,
        PORT_SSL: 443,
        CERT_FILE: "certificates/proxy.cer",
        CERT: fs.readFileSync("certificates/proxy.cer").toString(),
        KEY_FILE: "certificates/proxy.key",
        KEY: fs.readFileSync("certificates/proxy.key").toString(),
        //CA_FILE: "certificates/ca.cer",
        //CA: fs.readFileSync("certificates/ca.cer").toString(),
    }
};

export default config;