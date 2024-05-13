import pino from "pino";
import { IS_TEST } from 'src/config';

const getLevel = () => {
    if (IS_TEST) return 'silent';
    return 'info';
};

export const logger = pino({ level: getLevel()});
