import expect = require("expect.js");
import { SinonStub } from "sinon";
import { IMock, It, Mock, Times, ExpectedCallType } from "typemoq";
import { FormatsRegistry } from "../src/formats";
import { Logger, LoggerFactory, LogHandler, LogLevels, LogRecord } from "../src/interfaces";
import { ChildLogger, RootLogger } from "../src/Logger";
import { DefaultLoggerFactory } from "../src/LoggerFactory";
import { OutputsRegistry } from "../src/outputs";
import sinon = require("sinon");

describe("Given a RootLogger", () => {

    let handlerMock: IMock<LogHandler>;
    let sut: RootLogger;

    beforeEach(() => {
        handlerMock = Mock.ofType();
        sut = new RootLogger();
        sut.handler = handlerMock.object;
    });

    context("When the level is DEBUG", () => {

        beforeEach(() => {
            sut.level = LogLevels.DEBUG;
        });

        it("should write debug messages", () => {
            sut.debug("message");
            const record: LogRecord = {
                level: "DEBUG",
                logger: sut,
                message: "message",
                args: []
            };
            handlerMock.verify(m => m(It.isValue(record)), Times.once());
        });

        it("should write info messages", () => {
            sut.info("message", 42);
            const record: LogRecord = {
                level: "INFO",
                logger: sut,
                message: "message",
                args: [42]
            };
            handlerMock.verify(m => m(It.isValue(record)), Times.once());
        });
    });

    context("When the level is INFO", () => {
        beforeEach(() => {
            sut.level = LogLevels.INFO;
        });

        it("should not write debug messages", () => {
            sut.debug("message");
            handlerMock.verify(m => m(It.isAny()), Times.never());
        });

        it("should write errors", () => {
            const error = new Error("error message");
            sut.error("message", error);
            const record: LogRecord = {
                level: "ERROR",
                logger: sut,
                message: "message",
                args: [error]
            };
            handlerMock.verify(m => m(It.isValue(record)), Times.once());
        });
    });
});

describe("Given a ChildLogger", () => {

    let handlerMock: IMock<LogHandler>;
    let parentHandlerMock: IMock<LogHandler>;
    let parent: ChildLogger;
    let sut: ChildLogger;

    beforeEach(() => {
        handlerMock = Mock.ofType();
        parentHandlerMock = Mock.ofType();
        parent = new ChildLogger("parent", new RootLogger(), LogLevels.ERROR, parentHandlerMock.object);
        sut = new ChildLogger("child", parent);
    });

    context("When the level and handler are not configured", () => {

        it("should use the parent's", () => {
            sut.info("ignored");
            sut.error("message");
            const record: LogRecord = {
                level: "ERROR",
                logger: sut,
                message: "message",
                args: []
            };
            parentHandlerMock.verify(m => m(It.isValue(record)), Times.once());
        });
    });

    context("When the level is configured", () => {

        beforeEach(() => {
            sut.setLevel(LogLevels.INFO);
        });

        it("should use it", () => {
            sut.info("message");
            sut.debug("ignored");
            const record: LogRecord = {
                level: "INFO",
                logger: sut,
                message: "message",
                args: []
            };
            parentHandlerMock.verify(m => m(It.isValue(record)), Times.once());
        });
    });

    context("When the handler is configured", () => {

        beforeEach(() => {
            sut.setHandler(handlerMock.object);
        });

        it("should use it", () => {
            sut.info("ignored");
            sut.error("message");
            const record: LogRecord = {
                level: "ERROR",
                logger: sut,
                message: "message",
                args: []
            };
            handlerMock.verify(m => m(It.isValue(record)), Times.once());
        });
    });
});

describe("Given the \"stdout\" handler", () => {

    const handler = OutputsRegistry.stdout as LogHandler;
    let consoleLog: SinonStub<any[], void>;

    beforeEach(() => {
        consoleLog = sinon.stub(console, "log");
    });

    afterEach(() => {
        consoleLog.restore();
    });

    context("When logging messages", () => {

        it("should invoke console.log", () => {
            handler({
                logger: Mock.ofType<Logger>().object,
                level: "INFO",
                message: "message",
                args: [],
            });
            expect(consoleLog.called).to.be(true);
        });
    });

});

describe("Given the \"simple\" format", () => {

    const handler = FormatsRegistry.simple as LogHandler;
    let loggerMock: IMock<Logger>;

    beforeEach(() => {
        loggerMock = Mock.ofType<Logger>();
        loggerMock.setup(m => m.name).returns(() => "Logger");
    });

    context("When logging messages", () => {

        it("should add the logger level and name", () => {
            const record: LogRecord = {
                logger: loggerMock.object,
                level: "INFO",
                message: "message",
                args: [],
            };
            handler(record);
            expect(record.message).to.be("INFO Logger message");
        });
    });

});

describe("Given the LoggerFactory class", () => {

    let loggerFactory: LoggerFactory;

    beforeEach(() => {
        loggerFactory = new DefaultLoggerFactory();
    });

    context("When using the default configuration", () => {
        it("should use DEBUG as default level", () => {
            const logger = loggerFactory.getLogger("test");
            expect(logger.level).to.be(LogLevels.DEBUG);
        });
    });

    context("When configure with multiple configs", () => {

        it("should merge configs in ascending priority", () => {
            loggerFactory.configure(
                {loggers: {test: "INFO"}},
                {loggers: {test: {level: "WARNING"}}}
            );
            const logger = loggerFactory.getLogger("test");
            expect(logger.level).to.be(LogLevels.WARNING);
        });
    });

    context("When reconfiguring", () => {

        it("should update existing loggers", () => {
            const logger = loggerFactory.getLogger("taest");
            expect(logger.level).to.be(LogLevels.DEBUG);
            loggerFactory.configure(
                {loggers: {taest: "INFO"}},
            );
            expect(logger.level).to.be(LogLevels.INFO);
            loggerFactory.configure();
            expect(logger.level).to.be(LogLevels.DEBUG);
        });
    });

    context("When getting a logger", () => {

        it("should return a logger with the right ancestry", () => {
            const logger: any = loggerFactory.getLogger("grandparent.parent.child");
            expect(logger.name).to.be("grandparent.parent.child");
            expect(logger.parent.name).to.be("grandparent.parent");
            expect(logger.parent.parent.name).to.be("grandparent");
            expect(logger.parent.parent.parent.name).to.be("default");
        });

        it("should return a logger with the right handlers chain", () => {
            const handlersMock: IMock<{ [k: string]: LogHandler }> = Mock.ofType();

            loggerFactory.configure(
                {
                    handlers: {
                        format: handlersMock.object.format,
                        custom: handlersMock.object.custom,
                        output: handlersMock.object.output,
                    },
                    loggers: {
                        test: {
                            format: "format",
                            handlers: ["custom"],
                            output: "output"
                        }
                    }
                }
            );

            const logger = loggerFactory.getLogger("test");
            const record: LogRecord = {
                level: "ERROR",
                logger: logger,
                message: "message",
                args: []
            };

            for (const handlerName of ["format", "custom", "output"]) {
                handlersMock.setup(m => m[handlerName](It.isValue(record)))
                    .verifiable(Times.once(), ExpectedCallType.InSequence);
            }

            logger.error("message");
            handlersMock.verifyAll();
        });
    });

});
