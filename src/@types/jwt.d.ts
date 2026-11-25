declare module "jsonwebtoken" {
  export interface SignOptions {
    expiresIn?: string | number;
    notBefore?: string | number;
    audience?: string | string[];
    algorithm?: string;
    header?: object;
    encoding?: string;
    issuer?: string;
    subject?: string;
    jwtid?: string;
    noTimestamp?: boolean;
    keyid?: string;
    mutatePayload?: boolean;
  }

  export function sign(
    payload: string | Buffer | object,
    secretOrPrivateKey: any,
    options?: SignOptions
  ): string;

  export function verify(
    token: string,
    secretOrPublicKey: any,
    options?: any
  ): any;

  export function decode(token: string, options?: any): any;

  const jwt: {
    sign: typeof sign;
    verify: typeof verify;
    decode: typeof decode;
  };

  export default jwt;
}
