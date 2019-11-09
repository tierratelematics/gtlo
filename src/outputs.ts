import { HandlerRegistry, EffectiveLogLevel } from "./interfaces";

const levelHandlers: {[K in EffectiveLogLevel]: typeof console.log } = {
    // console methods are already bound
    DEBUG: console.debug,
    INFO: console.info,
    WARNING: console.warn,
    ERROR: console.error
};

export const OutputsRegistry: HandlerRegistry = {
    stdout: record => {
        console.log(record.message, ...record.args);
    },
    stderr: record => {
        console.error(record.message, ...record.args);
    },
    console: record => {
        levelHandlers[record.level](record.message, ...record.args);
    }
};
