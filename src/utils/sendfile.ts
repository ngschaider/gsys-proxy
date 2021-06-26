import fs from "fs";
import { ServerResponse } from "http";
import path from "path";


export enum ServerPage {
    Forbidden = "forbidden.html",
    Disabled = "disabled.html",
    NotFound = "notFound.html",
}

export const sendFile = async (res: ServerResponse, serverPage: ServerPage) => {
    const pathToFile = path.resolve(__dirname + "/../../static/" + serverPage);
    const stream = fs.createReadStream(pathToFile);
    stream.pipe(res);

    stream.on("end", () => {
        res.end();
    });
}