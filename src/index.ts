export * from "./interfaces";
import { DefaultLoggerFactory } from "./LoggerFactory";
import { automagic } from "./config";

export const loggerFactory = new DefaultLoggerFactory();
automagic(loggerFactory);
