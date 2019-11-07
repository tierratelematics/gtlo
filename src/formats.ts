import { HandlerRegistry } from "./interfaces";

export const FormatsRegistry: HandlerRegistry = {
    none: () => { /* noop */ },
    named: record => {
        record.message = `${record.logger.name} ${record.message}`;
    },
    simple: record => {
        record.message = `${record.level} ${record.logger.name} ${record.message}`;
    },
    timed: record => {
        record.message = `${new Date().toISOString()} ${record.level} ${record.logger.name} ${record.message}`;
    }
};
