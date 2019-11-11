# gtlo

A no-frills logging Typescript/Javascript library for NodeJs, because most of
the times you just need to __Get The Logs Out__ for something else to pick them
up.

[![Build status](https://api.travis-ci.org/tierratelematics/gtlo.svg?branch=master)](https://api.travis-ci.org/tierratelematics/gtlo)
[![npm version](https://badge.fury.io/js/gtlo.svg)](https://badge.fury.io/js/gtlo)

Features:

* log levels
* configurable level thresholds and formats
* lazy message string formatting, compatible with `console` methods
* hierarchical named loggers, statically instantiated
* automatic configuration via environment and hot reconfiguration
* zero runtime npm dependencies

## Getting started

Install `gtlo` from [npm](https://www.npmjs.com/package/gtlo).

Instantiate loggers via the static `LoggerFactory`, giving a name string, or
even a class or function:

```typescript
import { loggerFactory } from "gtlo";

class MyImportantClass {
    private readonly logger = loggerFactory.getLogger(MyImportantClass);
    // ...
}
```

Then log using format strings:

```typescript
const answer = 42;
this.logger.info("The answers is %d.", answer);
```

With the builtin `simple` format, this will print:

```
INFO MyImportantClass The answer is 42.
```

Lazy message interpolation is reasonably efficent, but it's also possible to
actively check the level and avoid doing anything too expensive if it is going
to be thrown away:

```typescript
if (this.logger.level <= LogLevels.DEBUG) {
    this.logger.debug("The details are %j", computeDetails());
}
```

Good logs take dedication, but that's 95% of the story. The rest is
configuring things to get the desired output.

One can to things manually and just pass one or more `LogConfig` objects:

```typescript
loggerFactory.configure({default: {level: "INFO", format: "simple"}});
```

However there's more that one way to provide configuration so that it will be
picked up automatically before any logger is built.

The easiest is the `GTLO` environment variable:

```bash
export GTLO='{"default": {"level": "INFO", "format": "simple", "output": "stderr"}}'
```

Using a `GTLO_MODS` environment variable you can load json or javascript files:

```bash
export GTLO_MODS="mynpm/gtlo,$PWD/gtlo.json"
```

All configurations are merged in order (`GTLO_MODS`, then `GTLO`). If you
don't configure anything, loggers will behave exacly like the `console`.

In the browser, global `window` attributes serve in place of the environment.

## Why another logging library?

Because at some point we could not find a library that already had this set of
features and not a lot more. Today the situation is better but pack this much
in less than 2Kb when minified and zipped.

In the modern infrastructure the only thing you need to do is print to
standard facilities. This code is meant to rely on the log management
solution to store the logs and just be small and fast.

When running in a container, the log driver will probably add a timestamp on
each line, so the `simple` format and `stderr` output are enough.

When running in AWS Lambda, `named` and `console` will give great integration
with Cloudwatch.

Furthermore, we did not completely reinvent the wheel but took after the
designs of Slf4j, log4j, Python's `logging` module and the javascript `console`.

## Advanced usage

### Loggers hierarchy

Loggers can have a tree-like hierarchical structure, defined by dots in the name:

```typescript
const logger = loggerFactory.getLogger("mypackage.mymodule");
const other = loggerFactory.getLogger("mypackage.myothermodule");
```

The loggers will use the most specific configuration provided at any level or
ultimately use the defaults for the root logger.

### Handlers

Log records are passed to a chain of handlers, usually made of two functions:
one for formatting and the other for printing.

The available built in format handlers are:

* `none`
* `named`: adds the logger name
* `simple`: adds the level and logger name
* `timed`: adds a timestamp, level and logger name

The built in outputs handlers are:

* `stdout`
* `stderr`
* `console`: default, uses stardard output or error depending on level

### More configuration

An example of advanced setup that uses a javascript module to specify custom
handlers is the following:

```javascript
module.exports = {
  handlers: {
      utcTime: record => {
          record.message = `[${new Date().toISOString().substring(11, 23)}] ${record.message}`
      }
  },
  default: {
      level: "DEBUG",
      format: "utcTime", // handlers are referenced by name
      output: "stdout"
  },
  loggers: {
      mypackage: "WARNING", // the level can be configured very simply
      "mypackage.important": { // more settings are available with an object
          level: "INFO",
          output: "stderr",
          // if any handler is set, others are not inherited, so the format here becomes "none"
      }
  }
};
```

For very specific use cases it is also possible to add more handlers, either
class or function based, but that's for people who look at the source code.

For unit tests, it makes sense to disable all logging:

```bash
export GTLO_MODS="" # If you are using mods
export GTLO='{"default": "DISABLED"}'
```

In production, configured levels can also be manipulated at runtime, but it
will take some coding:

```typescript
const loggers = loggerFactory.getAllLoggers(); // what's the situation?
loggerFactory.getLogger('please.stop').level = LogLevels.DISABLED);
loggerFactory.configure() // reapply previous configuration
```

## Contributing

We are happy with how things are working now, but PRs are welcome, provided
they keep with minimalist nature of the project.
