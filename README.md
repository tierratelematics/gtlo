# gtlo

A no-frills logging Typescript/Javascript library for NodeJs, because most of
the times you just need to Get The Logs Out and something else will pick them
up.

Features:

* log levels
* hierarchical named loggers, statically instantiated
* configurable level thresholds and formats
* automatic configuration via environment and hot reconfiguration
* lazy message string formatting, compatible with `console` methods
* reach a standard output with minimal efforts and integrate with the log
  management infrastructure
* zero runtime npm dependencies

## Getting started

Install `gtlo` from [npm](https://www.npmjs.com/package/gtlo).

Instantiate loggers with a name, or take it from the file, a class, a function:

```javascript
import { loggerFactory } from "gtlo";

class MyImportantClass {
    private readonly logger = loggerFactory.getLogger(MyImportantClass);
    // ...
}
```

Then log using format strings:

```javascript
    const answer = 42;
    this.logger.info("The answers is %d.", answer);
```

Using the `simple` format, this will print:

```
INFO MyImportantClass The answer is 42.
```

When running use there's more that one way to provide configuration and it
will be picked up automatically.

Using a `GTLO` environment variable to set levels:

```bash
export GTLO='{"default": "WARNING", "loggers": {"MyImportantClass": "DEBUG"}}'
```

Using a `GTLO_MODS` environment variable to load json or javascript files:

```bash
export GTLO_MODS="mynpm/gtlo,$PWD/gtlo.json"
```

All configurations are merged in order (`GTLO_MODS`, then `GTLO`). If you
don't configure anything, loggers will behave exacly like the `console`.

In the browser global `window` attributes serve in place of the environment.

## Why another logging library?

Because we could not find a library that already had this set of features and
not a lot more.

In the modern infrastructure the only thing you need to do is print to
standard facilities and this code is meant to rely on the log management
solution to store the logs and just be small and fast.

When running in a container, the log driver will add a timestamp on each line
so the `simple` format is enough.

When running in AWS Lambda, using the `console` and the `named` format will
give great integration with Cloudwatch.

Anyhow we did not completely reinvent the wheel but took after the designs of
Slf4j, Python's `logging` module and the javascript `console`.

## Configuration format

And advanced setup needs a javascript module to specify custom handlers:

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
      noisy: "WARNING", // the level can be configured very simply
      "noisy.important": { // more settings are available with an object
          level: "INFO",
          output: "stderr",
          // if any handler is set, others are no inherited, so the format here becomes "none"
      }
  }
};
```

To disable all logging:

```bash
export GTLO='{"default": "DISABLED"}'
export GTLO_MODS=""
```

## Contributing

We are happy with how things are working now, but PRs are welcome, provided
they keep with minimalist nature of the project.
