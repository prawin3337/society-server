import { IResponse } from ".";

export class ApiResponse {
    public data: IResponse;
    public statusCode: number;

    constructor(err: any, row: any) {
        this.statusCode = err ? 500 : 200;
        this.data = {
            success: err ? false : true,
            data: err ? err : row
        }
    }
}