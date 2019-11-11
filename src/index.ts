import { automagic } from "./config";
import { LoggerFactory } from "./interfaces";
import { DefaultLoggerFactory } from "./LoggerFactory";

export * from "./interfaces";
export const loggerFactory: LoggerFactory = new DefaultLoggerFactory();
automagic(loggerFactory);
