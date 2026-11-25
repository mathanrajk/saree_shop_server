declare module "cors" {
  import { RequestHandler } from "express";

  interface CorsOptions {
    origin?: any;
    methods?: any;
    allowedHeaders?: any;
    exposedHeaders?: any;
    credentials?: boolean;
    maxAge?: number;
    preflightContinue?: boolean;
    optionsSuccessStatus?: number;
  }

  function cors(options?: CorsOptions): RequestHandler;
  export = cors;
}
