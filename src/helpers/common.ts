import _ from 'lodash';
import moment from 'moment';

export const isEmail = (email: string): boolean => {
    const emailRegex =
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    return emailRegex.test(email);
};

export const isMobileNumber = (stringNumber: string): boolean => {
    const mobileNumberRegex = /^\+?[1-9]\d{7,14}$/;

    return mobileNumberRegex.test(stringNumber);
};

export const addHttpPrefix = (url: string) => {
    if (!url) {
        return url;
    }

    if (!url.toLowerCase().startsWith('http')) {
        return `http://${url}`;
    }
    return url.substring(0, 5).toLowerCase() + url.substring(5);
};


export const generateOtp = () => {
    return {
      emailOtpCode: (Math.floor(Math.random() * (900000)) + 100000).toString(),
      eamilOtpCodeExpiresAt: moment().add(5, 'minutes').toDate()
    }
}

export const checkOtpResendAble = (eamilOtpCodeExpiresAt: Date) => {
    const otpCreatedAt = moment(eamilOtpCodeExpiresAt).subtract(5, "minutes");
    if (moment().isBefore(otpCreatedAt.add(30, 'second'))) {
        return true
    }
    return false
}