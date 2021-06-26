import { ConnectionOptions, DatabaseType } from "typeorm";
import { BaseConnectionOptions } from "typeorm/connection/BaseConnectionOptions";
import { MysqlConnectionOptions } from "typeorm/driver/mysql/MysqlConnectionOptions";

export const database: any = {
    "type": (process.env.DB_TYPE as DatabaseType) || "mariadb",
    "host": process.env.DB_HOST || "localhost",
    "username": process.env.DB_USERNAME || "root",
    "password": process.env.DB_PASSWORD || "root",
    "port": process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    "database": process.env.DB_NAME || "gsys-proxy",
    "synchronize": true,
    "entities": [
        "src/models/**/*.ts"
    ],
    "migrations": [
        "src/migrations/**/*.ts"
    ],
    "cli": {
        "entitiesDir": "src/models",
        "migrationsDir": "src/migrations"
    }
};

export default {
    database,
};