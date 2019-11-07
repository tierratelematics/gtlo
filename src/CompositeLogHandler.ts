import { LogHandlerObject, LogRecord, LogHandler } from "./interfaces";

export class CompositeLogHandler implements LogHandlerObject {

    public static build(_delegates: Array<LogHandler|LogHandlerObject>): LogHandler|undefined {
        const delegates = _delegates.map(CompositeLogHandler.toHandler);
        if (delegates.length === 0) {
            return;
        }
        if (delegates.length === 1) {
            return CompositeLogHandler.toHandler(delegates[0]);
        }
        const composite = new CompositeLogHandler(...delegates as [LogHandler, ...LogHandler[]]);
        return CompositeLogHandler.toHandler(composite);
    }

    private static toHandler(handler: LogHandler|LogHandlerObject): LogHandler {
        if (typeof handler === "function" ) {
            return handler;
        }
        if (typeof handler === "object" && typeof handler.handle === "function") {
            return record => handler.handle(record);
        }
        throw new Error("Invalid log handler");
    }

    private readonly delegates: LogHandler[];

    constructor(delegate: LogHandler, ...delegates: LogHandler[]) {
        delegates.unshift(delegate);
        this.delegates = delegates;
    }

    public handle(record: LogRecord): void {
        for (const handler of this.delegates) {
            handler(record);
        }
    }

}
