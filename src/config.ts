import { FormatsRegistry } from "./formats";
import { LogConfig, LogConfigEntry, LoggerFactory } from "./interfaces";
import { OutputsRegistry } from "./outputs";

export interface ExpandedLogConfig extends Required<LogConfig> {
    default: LogConfigEntry;
    loggers: {[k: string]: LogConfigEntry};
}

export interface EffectiveLogConfig extends ExpandedLogConfig {
    default: Required<LogConfigEntry>;
}

export const DEFAULT_CONFIG: EffectiveLogConfig = {
    handlers: {...FormatsRegistry, ...OutputsRegistry},
    default: {
        level: "DEBUG",
        format: "none",
        handlers: [],
        output: "console"
    },
    loggers: {}
};

export const DEFAULT_LOGGER = "default";

interface Autoconfig {
    GTLO_MODS?: string;
    GTLO?: string|LogConfig;
}

function getAutoconfig(): Autoconfig {
    return (process?.env || window || {}) as Autoconfig;
}

function loadModConfigs(autoconfig: Autoconfig, configs: LogConfig[]): void {
    const mods = autoconfig.GTLO_MODS;
    if (mods) {
        for (const mod of mods.split(",")) {
            configs.push(require(mod));
        }
    }
}

function loadEnvConfig(autoconfig: Autoconfig, configs: LogConfig[]) {
    const config = autoconfig.GTLO;
    if (typeof config === "object") {
        configs.push(config);
    } else if (config) {
        configs.push(JSON.parse(config));
    }
}

export function automagic(loggerFactory: LoggerFactory): void {
    const configs: LogConfig[] = [];
    const autoconfig = getAutoconfig();
    loadModConfigs(autoconfig, configs);
    loadEnvConfig(autoconfig, configs);
    if (configs.length) {
        loggerFactory.configure(...configs);
    }
}
