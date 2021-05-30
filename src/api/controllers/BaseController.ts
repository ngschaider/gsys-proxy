import { Response } from "express";
import ResponseCode from "../ResponseCode";
import ResponseMessage from "../ResponseMessage";
import ResponseType from "../ResponseType";

class BaseController {

    notEnoughParameters(res: Response) {
        res.json({
            type: ResponseType.Error,
            code: ResponseCode.NOT_ENOUGH_PARAMETERS,
            message: ResponseMessage.NOT_ENOUGH_PARAMETERS,
        });
    }

    invalidToken(res: Response) {
        res.json({
            type: ResponseType.Error,
            message: ResponseMessage.INVALID_TOKEN,
            code: ResponseCode.INVALID_TOKEN,
        });
    }

    notEnoughPermissions(res: Response) {
        res.json({
            type: ResponseType.Error,
            message: ResponseMessage.NOT_ENOUGH_PERMISSIONS,
            code: ResponseCode.NOT_ENOUGH_PERMISSIONS,
        });
    }

}

export default BaseController;