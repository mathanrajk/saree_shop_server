export enum ErrorType {
  Id = "id",
  NotFound = "notFound",
  Required = "required",
  Invalid = "invalid",
  Duplicate = "duplicate",
  Unauthorized = "unauthorized",
  Forbidden = "forbidden",
}

export interface ErrorResponse {
  message: string;
  status: number;
}

export const errorHandle = (error: ErrorType, errorname: string): ErrorResponse => {
  switch (error) {
    case ErrorType.Id:
      return { message: `Invalid ${errorname} ID. Please check the ID.`, status: 400 };
    case ErrorType.NotFound:
      return { message: `${errorname} not found.`, status: 404 };
    case ErrorType.Required:
      return { message: `${errorname} is required.`, status: 400 };
    case ErrorType.Invalid:
      return { message: `Invalid ${errorname}.`, status: 400 };
    case ErrorType.Duplicate:
      return { message: `${errorname} already exists.`, status: 409 };
    case ErrorType.Unauthorized:
      return { message: "You need to log in to do this.", status: 401 };
    case ErrorType.Forbidden:
      return { message: "You don't have permission to do this.", status: 403 };
    default:
      return { message: "Something went wrong. Please try again.", status: 500 };
  }
};