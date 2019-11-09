export enum LogLevels {
    DEBUG, INFO, WARNING, ERROR, DISABLED
}

export type LogLevel = keyof typeof LogLevels;
export type EffectiveLogLevel = Exclude<LogLevel, "DISABLED">;

export interface Logger {
    readonly name: string;
    level: LogLevels;
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
}

export interface LogRecord {
    logger: Logger;
    level: EffectiveLogLevel;
    message: string;
    args: any[];
}

export type LogHandler = (record: LogRecord) => void;

export interface LogHandlerObject {
    handle: LogHandler;
}

export interface HandlerRegistry {
    [name: string]: LogHandler | LogHandlerObject;
}

export interface LogConfigEntry {
    level?: LogLevel;
    format?: string;
    output?: string;
    handlers?: string[];
}

export interface LogConfig {
    handlers?: HandlerRegistry;
    default?: LogLevel | LogConfigEntry;
    loggers?: {[k: string]: LogLevel | LogConfigEntry};
}

export interface LoggerFactory {
    configure(...configs: LogConfig[]): void;
    reconfigure(...configs: LogConfig[]): void;
    getLogger(name: string | { name: string }): Logger;
    getAllLoggers(): Logger[]
}
