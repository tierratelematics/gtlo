import { CompositeLogHandler } from "./CompositeLogHandler";
import { DEFAULT_CONFIG, DEFAULT_LOGGER, EffectiveLogConfig, ExpandedLogConfig } from "./config";
import { LogConfig, LogConfigEntry, Logger, LoggerFactory, LogHandler, LogLevels } from "./interfaces";
import { BaseLogger, ChildLogger, RootLogger } from "./Logger";

interface LoggersRegistry {
    [name: string]: ChildLogger|undefined;
}

export class DefaultLoggerFactory implements LoggerFactory {

    private config: EffectiveLogConfig = DEFAULT_CONFIG;
    private readonly rootLogger = new RootLogger();
    private readonly loggers: LoggersRegistry = {};

    public reconfigure(...configs: LogConfig[]): void {
        this.config = DEFAULT_CONFIG;
        this.configure(...configs);
    }

    public configure(...configs: LogConfig[]): void {
        if (this.config === DEFAULT_CONFIG) {
            this.config = {
                default: {} as Required<LogConfigEntry>,
                handlers: {},
                loggers: {}
            };
            this.mergeConfig(DEFAULT_CONFIG);
        }
        for (const config of configs) {
            this.mergeConfig(config);
        }
        this.configureRootLogger();
        for (const name of Object.getOwnPropertyNames(this.loggers)) {
            const logger = this.loggers[name]!;
            this.configureLogger(logger);
        }
    }

    public getLogger(name: string | { name: string }): Logger {
        if (typeof name !== "string") {
            name = name.name;
        }
        return this._getLogger(name);
    }

    public getAllLoggers(): Logger[] {
        const loggers: Logger[] = [this.rootLogger];
        loggers.push(...Object.values(this.loggers) as Logger[]);
        loggers.sort((a, b) => a.name.localeCompare(b.name));
        return loggers;
    }

    private _getLogger(name: string): BaseLogger {
        if (name === DEFAULT_LOGGER) {
            return this.rootLogger;
        }
        let logger = this.loggers[name];
        if (logger) {
            return logger;
        }

        const parent = this._getLogger(this.getParentName(name));
        logger = new ChildLogger(name, parent);
        this.configureLogger(logger);

        this.loggers[name] = logger;
        return logger;
    }

    private configureLogger(logger: ChildLogger): void {
        const configEntry = this.config.loggers[logger.name] || {};
        logger.setLevel(LogLevels[configEntry.level!]);
        logger.setHandler(this.makeHandler(configEntry));
    }

    private configureRootLogger(): void {
        const configEntry = this.config.default as Required<LogConfigEntry>;
        this.rootLogger.level = LogLevels[configEntry.level];
        this.rootLogger.handler = this.makeHandler(configEntry)!;
    }

    private getParentName(name: string): string {
        return name.split(".").slice(0, -1).join(".") || DEFAULT_LOGGER;
    }

    private makeHandler(configEntry: LogConfigEntry): LogHandler|undefined {
        const handlers = [configEntry.format, ...configEntry.handlers || [], configEntry.output]
            .filter(name => !!name)
            .map(name => this.config.handlers[name!]);
        return CompositeLogHandler.build(handlers);
    }

    private mergeConfig(config: LogConfig): void {
        this.expandConfig(config);
        for (const key of Object.getOwnPropertyNames(config) as Array<keyof ExpandedLogConfig>) {
            Object.assign(this.config[key], config[key]);
        }
    }

    private expandConfig(config: LogConfig): asserts config is ExpandedLogConfig {
        if (typeof config.default === "string") {
            config.default = { level: config.default };
        }
        if (config.loggers) {
            for (const key of Object.getOwnPropertyNames(config.loggers)) {
                const entry = config.loggers[key];
                if (typeof entry === "string") {
                    config.loggers[key] = { level: entry };
                }
            }
        }
        config.handlers = config.handlers || {};
    }
}
