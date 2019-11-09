export * from "./interfaces";
import { automagic } from "./config";
import { DefaultLoggerFactory } from "./LoggerFactory";

export const loggerFactory = new DefaultLoggerFactory();
automagic(loggerFactory);
