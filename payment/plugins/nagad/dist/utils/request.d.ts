import { IHeaders } from '../interfaces/headers.interface';
interface IPayload {
    [key: string]: unknown;
}
export declare function get<T>(url: string, additionalHeaders: IHeaders): Promise<T>;
export declare function post<T>(url: string, payload: IPayload, additionalHeaders: IHeaders): Promise<T>;
export {};
