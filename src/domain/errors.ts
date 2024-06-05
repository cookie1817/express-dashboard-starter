
export const ErrorCodes = {
    BAD_REQUEST: 'BAD_REQUEST',
    API_VALIDATION_ERROR: 'API_VALIDATION_ERROR',
    WRONG_EMAIL_AND_PASSWORD: 'WRONG_EMAIL_AND_PASSWORD',
    EMAIL_EXISTED: 'EMAIL_EXISTED',
    OTP_EXPIRED: 'OTP_EXPIRED',
    INVALID_TOKEN: 'INVALID_TOKEN',
    OTP_CODE_NOT_MATCH: 'OTP_CODE_NOT_MATCH',
    EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
    TOKEN_NOT_FOUND: 'TOKEN_NOT_FOUND',
    ACCESS_DENIED: 'ACCESS_DENIED',
    BUSINESS_NAME_EXISTED: 'BUSINESS_NAME_EXISTED',
    CREATED_ACCOUNT_FAILS: 'CREATED_ACCOUNT_FAILS',
    NOT_FOUND: 'NOT_FOUND',
    EMAIL_ALREADY_VERIFIED: 'EMAIL_ALREADY_VERIFIED',
    TOO_MANY_REQUEST: 'TOO_MANY_REQUEST',
    BUSINESS_NOT_FOUND: 'BUSINESS_NOT_FOUND',
    SERVER_ERROR: 'SERVER_ERROR',
    SEND_EMAIL_ERROR: 'SEND_EMAIL_ERROR',
};
export const ErrorCodeMap: { [key: string]: number } = {
    BAD_REQUEST: 400,
    API_VALIDATION_ERROR: 400,
    WRONG_EMAIL_AND_PASSWORD: 400,
    TOKEN_NOT_FOUND: 401,
    INVALID_TOKEN: 401,
    OTP_CODE_NOT_MATCH: 401,
    EMAIL_NOT_VERIFIED: 401,
    ACCESS_DENIED: 403,
    NOT_FOUND: 404,
    EMAIL_EXISTED: 409,
    OTP_EXPIRED: 410,
    EMAIL_ALREADY_VERIFIED: 409,
    BUSINESS_NAME_EXISTED: 409,
    CREATED_ACCOUNT_FAILS: 424,
    TOO_MANY_REQUEST: 429,
    SERVER_ERROR: 500,
    SEND_EMAIL_ERROR: 500
};
