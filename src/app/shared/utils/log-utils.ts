import { HTTPMethod } from '../model';

export class LogUtils {

    static HTTP_METHOD_STYLE = `        
        background-color: darkblue;
        color: white; 
        font-style: italic; 
        border-radius: 2px;
        padding: 0 .3em 0 .3em;
    `;

    static logHttpRequest(httpMethod: HTTPMethod, url: string, body?: any): void {
        if (body) {
            console.log('%c' + httpMethod, LogUtils.HTTP_METHOD_STYLE, url, body);
        } else {
            console.log('%c' + httpMethod, LogUtils.HTTP_METHOD_STYLE, url);
        }
    }
}