import { DEFAULT_CONFIG, DEFAULT_LOGGER } from "./config";
import { EffectiveLogLevel, Logger, LogHandler, LogLevels, LogRecord } from "./interfaces";
import { OutputsRegistry } from "./outputs";

export abstract class BaseLogger implements Logger {

    public abstract level: LogLevels;
    public readonly abstract name: string;
    public readonly abstract handler: LogHandler;

    public debug(message: string, ...args: any[]): void {
        if (this.level <= LogLevels.DEBUG) {
            this.log("DEBUG", message, args);
        }
    }

    public info(message: string, ...args: any[]): void {
        if (this.level <= LogLevels.INFO) {
            this.log("INFO", message, args);
        }
    }

    public warn(message: string, ...args: any[]): void {
        if (this.level <= LogLevels.WARNING) {
            this.log("WARNING", message, args);
        }
    }

    public error(message: string, ...args: any[]): void {
        if (this.level <= LogLevels.ERROR) {
            this.log("ERROR", message, args);
        }
    }

    private log(level: EffectiveLogLevel, message: string, args: any[]) {
        const record: LogRecord = {
            logger: this,
            level: level,
            message: message,
            args: args
        };
        this.handler(record);
    }
}

export class RootLogger extends BaseLogger {
    public readonly name = DEFAULT_LOGGER;
    public level = LogLevels[DEFAULT_CONFIG.default.level];
    public handler = OutputsRegistry[DEFAULT_CONFIG.default.output] as LogHandler;
}

export class ChildLogger extends BaseLogger {

    constructor(public readonly name: string,
                private readonly parent: BaseLogger,
                private _level?: LogLevels,
                private _handler?: LogHandler) {
        super();
    }

    public get handler(): LogHandler {
        return this._handler ?? this.parent.handler;
    }

    public setHandler(handler: LogHandler|undefined) {
        this._handler = handler;
    }

    public get level(): LogLevels {
        return this._level ?? this.parent.level;
    }

    public set level(level: LogLevels) {
        this.setLevel(level);
    }

    public setLevel(level: LogLevels|undefined) {
        this._level = level;
    }
}
