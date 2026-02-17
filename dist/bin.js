#!/usr/bin/env node
import { createRequire as __createRequire } from "node:module";
const require = __createRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x2) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x2, {
  get: (a2, b2) => (typeof require !== "undefined" ? require : a2)[b2]
}) : x2)(function(x2) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x2 + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/commander/lib/error.js
var require_error = __commonJS({
  "node_modules/commander/lib/error.js"(exports) {
    "use strict";
    var CommanderError2 = class extends Error {
      /**
       * Constructs the CommanderError class
       * @param {number} exitCode suggested exit code which could be used with process.exit
       * @param {string} code an id string representing the error
       * @param {string} message human-readable description of the error
       */
      constructor(exitCode, code, message) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
        this.code = code;
        this.exitCode = exitCode;
        this.nestedError = void 0;
      }
    };
    var InvalidArgumentError2 = class extends CommanderError2 {
      /**
       * Constructs the InvalidArgumentError class
       * @param {string} [message] explanation of why argument is invalid
       */
      constructor(message) {
        super(1, "commander.invalidArgument", message);
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
      }
    };
    exports.CommanderError = CommanderError2;
    exports.InvalidArgumentError = InvalidArgumentError2;
  }
});

// node_modules/commander/lib/argument.js
var require_argument = __commonJS({
  "node_modules/commander/lib/argument.js"(exports) {
    "use strict";
    var { InvalidArgumentError: InvalidArgumentError2 } = require_error();
    var Argument2 = class {
      /**
       * Initialize a new command argument with the given name and description.
       * The default is that the argument is required, and you can explicitly
       * indicate this with <> around the name. Put [] around the name for an optional argument.
       *
       * @param {string} name
       * @param {string} [description]
       */
      constructor(name, description) {
        this.description = description || "";
        this.variadic = false;
        this.parseArg = void 0;
        this.defaultValue = void 0;
        this.defaultValueDescription = void 0;
        this.argChoices = void 0;
        switch (name[0]) {
          case "<":
            this.required = true;
            this._name = name.slice(1, -1);
            break;
          case "[":
            this.required = false;
            this._name = name.slice(1, -1);
            break;
          default:
            this.required = true;
            this._name = name;
            break;
        }
        if (this._name.length > 3 && this._name.slice(-3) === "...") {
          this.variadic = true;
          this._name = this._name.slice(0, -3);
        }
      }
      /**
       * Return argument name.
       *
       * @return {string}
       */
      name() {
        return this._name;
      }
      /**
       * @package
       */
      _concatValue(value, previous) {
        if (previous === this.defaultValue || !Array.isArray(previous)) {
          return [value];
        }
        return previous.concat(value);
      }
      /**
       * Set the default value, and optionally supply the description to be displayed in the help.
       *
       * @param {*} value
       * @param {string} [description]
       * @return {Argument}
       */
      default(value, description) {
        this.defaultValue = value;
        this.defaultValueDescription = description;
        return this;
      }
      /**
       * Set the custom handler for processing CLI command arguments into argument values.
       *
       * @param {Function} [fn]
       * @return {Argument}
       */
      argParser(fn) {
        this.parseArg = fn;
        return this;
      }
      /**
       * Only allow argument value to be one of choices.
       *
       * @param {string[]} values
       * @return {Argument}
       */
      choices(values) {
        this.argChoices = values.slice();
        this.parseArg = (arg, previous) => {
          if (!this.argChoices.includes(arg)) {
            throw new InvalidArgumentError2(
              `Allowed choices are ${this.argChoices.join(", ")}.`
            );
          }
          if (this.variadic) {
            return this._concatValue(arg, previous);
          }
          return arg;
        };
        return this;
      }
      /**
       * Make argument required.
       *
       * @returns {Argument}
       */
      argRequired() {
        this.required = true;
        return this;
      }
      /**
       * Make argument optional.
       *
       * @returns {Argument}
       */
      argOptional() {
        this.required = false;
        return this;
      }
    };
    function humanReadableArgName(arg) {
      const nameOutput = arg.name() + (arg.variadic === true ? "..." : "");
      return arg.required ? "<" + nameOutput + ">" : "[" + nameOutput + "]";
    }
    exports.Argument = Argument2;
    exports.humanReadableArgName = humanReadableArgName;
  }
});

// node_modules/commander/lib/help.js
var require_help = __commonJS({
  "node_modules/commander/lib/help.js"(exports) {
    "use strict";
    var { humanReadableArgName } = require_argument();
    var Help2 = class {
      constructor() {
        this.helpWidth = void 0;
        this.minWidthToWrap = 40;
        this.sortSubcommands = false;
        this.sortOptions = false;
        this.showGlobalOptions = false;
      }
      /**
       * prepareContext is called by Commander after applying overrides from `Command.configureHelp()`
       * and just before calling `formatHelp()`.
       *
       * Commander just uses the helpWidth and the rest is provided for optional use by more complex subclasses.
       *
       * @param {{ error?: boolean, helpWidth?: number, outputHasColors?: boolean }} contextOptions
       */
      prepareContext(contextOptions) {
        this.helpWidth = this.helpWidth ?? contextOptions.helpWidth ?? 80;
      }
      /**
       * Get an array of the visible subcommands. Includes a placeholder for the implicit help command, if there is one.
       *
       * @param {Command} cmd
       * @returns {Command[]}
       */
      visibleCommands(cmd) {
        const visibleCommands = cmd.commands.filter((cmd2) => !cmd2._hidden);
        const helpCommand = cmd._getHelpCommand();
        if (helpCommand && !helpCommand._hidden) {
          visibleCommands.push(helpCommand);
        }
        if (this.sortSubcommands) {
          visibleCommands.sort((a2, b2) => {
            return a2.name().localeCompare(b2.name());
          });
        }
        return visibleCommands;
      }
      /**
       * Compare options for sort.
       *
       * @param {Option} a
       * @param {Option} b
       * @returns {number}
       */
      compareOptions(a2, b2) {
        const getSortKey = (option) => {
          return option.short ? option.short.replace(/^-/, "") : option.long.replace(/^--/, "");
        };
        return getSortKey(a2).localeCompare(getSortKey(b2));
      }
      /**
       * Get an array of the visible options. Includes a placeholder for the implicit help option, if there is one.
       *
       * @param {Command} cmd
       * @returns {Option[]}
       */
      visibleOptions(cmd) {
        const visibleOptions = cmd.options.filter((option) => !option.hidden);
        const helpOption = cmd._getHelpOption();
        if (helpOption && !helpOption.hidden) {
          const removeShort = helpOption.short && cmd._findOption(helpOption.short);
          const removeLong = helpOption.long && cmd._findOption(helpOption.long);
          if (!removeShort && !removeLong) {
            visibleOptions.push(helpOption);
          } else if (helpOption.long && !removeLong) {
            visibleOptions.push(
              cmd.createOption(helpOption.long, helpOption.description)
            );
          } else if (helpOption.short && !removeShort) {
            visibleOptions.push(
              cmd.createOption(helpOption.short, helpOption.description)
            );
          }
        }
        if (this.sortOptions) {
          visibleOptions.sort(this.compareOptions);
        }
        return visibleOptions;
      }
      /**
       * Get an array of the visible global options. (Not including help.)
       *
       * @param {Command} cmd
       * @returns {Option[]}
       */
      visibleGlobalOptions(cmd) {
        if (!this.showGlobalOptions) return [];
        const globalOptions = [];
        for (let ancestorCmd = cmd.parent; ancestorCmd; ancestorCmd = ancestorCmd.parent) {
          const visibleOptions = ancestorCmd.options.filter(
            (option) => !option.hidden
          );
          globalOptions.push(...visibleOptions);
        }
        if (this.sortOptions) {
          globalOptions.sort(this.compareOptions);
        }
        return globalOptions;
      }
      /**
       * Get an array of the arguments if any have a description.
       *
       * @param {Command} cmd
       * @returns {Argument[]}
       */
      visibleArguments(cmd) {
        if (cmd._argsDescription) {
          cmd.registeredArguments.forEach((argument) => {
            argument.description = argument.description || cmd._argsDescription[argument.name()] || "";
          });
        }
        if (cmd.registeredArguments.find((argument) => argument.description)) {
          return cmd.registeredArguments;
        }
        return [];
      }
      /**
       * Get the command term to show in the list of subcommands.
       *
       * @param {Command} cmd
       * @returns {string}
       */
      subcommandTerm(cmd) {
        const args = cmd.registeredArguments.map((arg) => humanReadableArgName(arg)).join(" ");
        return cmd._name + (cmd._aliases[0] ? "|" + cmd._aliases[0] : "") + (cmd.options.length ? " [options]" : "") + // simplistic check for non-help option
        (args ? " " + args : "");
      }
      /**
       * Get the option term to show in the list of options.
       *
       * @param {Option} option
       * @returns {string}
       */
      optionTerm(option) {
        return option.flags;
      }
      /**
       * Get the argument term to show in the list of arguments.
       *
       * @param {Argument} argument
       * @returns {string}
       */
      argumentTerm(argument) {
        return argument.name();
      }
      /**
       * Get the longest command term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      longestSubcommandTermLength(cmd, helper) {
        return helper.visibleCommands(cmd).reduce((max, command) => {
          return Math.max(
            max,
            this.displayWidth(
              helper.styleSubcommandTerm(helper.subcommandTerm(command))
            )
          );
        }, 0);
      }
      /**
       * Get the longest option term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      longestOptionTermLength(cmd, helper) {
        return helper.visibleOptions(cmd).reduce((max, option) => {
          return Math.max(
            max,
            this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option)))
          );
        }, 0);
      }
      /**
       * Get the longest global option term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      longestGlobalOptionTermLength(cmd, helper) {
        return helper.visibleGlobalOptions(cmd).reduce((max, option) => {
          return Math.max(
            max,
            this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option)))
          );
        }, 0);
      }
      /**
       * Get the longest argument term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      longestArgumentTermLength(cmd, helper) {
        return helper.visibleArguments(cmd).reduce((max, argument) => {
          return Math.max(
            max,
            this.displayWidth(
              helper.styleArgumentTerm(helper.argumentTerm(argument))
            )
          );
        }, 0);
      }
      /**
       * Get the command usage to be displayed at the top of the built-in help.
       *
       * @param {Command} cmd
       * @returns {string}
       */
      commandUsage(cmd) {
        let cmdName = cmd._name;
        if (cmd._aliases[0]) {
          cmdName = cmdName + "|" + cmd._aliases[0];
        }
        let ancestorCmdNames = "";
        for (let ancestorCmd = cmd.parent; ancestorCmd; ancestorCmd = ancestorCmd.parent) {
          ancestorCmdNames = ancestorCmd.name() + " " + ancestorCmdNames;
        }
        return ancestorCmdNames + cmdName + " " + cmd.usage();
      }
      /**
       * Get the description for the command.
       *
       * @param {Command} cmd
       * @returns {string}
       */
      commandDescription(cmd) {
        return cmd.description();
      }
      /**
       * Get the subcommand summary to show in the list of subcommands.
       * (Fallback to description for backwards compatibility.)
       *
       * @param {Command} cmd
       * @returns {string}
       */
      subcommandDescription(cmd) {
        return cmd.summary() || cmd.description();
      }
      /**
       * Get the option description to show in the list of options.
       *
       * @param {Option} option
       * @return {string}
       */
      optionDescription(option) {
        const extraInfo = [];
        if (option.argChoices) {
          extraInfo.push(
            // use stringify to match the display of the default value
            `choices: ${option.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`
          );
        }
        if (option.defaultValue !== void 0) {
          const showDefault = option.required || option.optional || option.isBoolean() && typeof option.defaultValue === "boolean";
          if (showDefault) {
            extraInfo.push(
              `default: ${option.defaultValueDescription || JSON.stringify(option.defaultValue)}`
            );
          }
        }
        if (option.presetArg !== void 0 && option.optional) {
          extraInfo.push(`preset: ${JSON.stringify(option.presetArg)}`);
        }
        if (option.envVar !== void 0) {
          extraInfo.push(`env: ${option.envVar}`);
        }
        if (extraInfo.length > 0) {
          return `${option.description} (${extraInfo.join(", ")})`;
        }
        return option.description;
      }
      /**
       * Get the argument description to show in the list of arguments.
       *
       * @param {Argument} argument
       * @return {string}
       */
      argumentDescription(argument) {
        const extraInfo = [];
        if (argument.argChoices) {
          extraInfo.push(
            // use stringify to match the display of the default value
            `choices: ${argument.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`
          );
        }
        if (argument.defaultValue !== void 0) {
          extraInfo.push(
            `default: ${argument.defaultValueDescription || JSON.stringify(argument.defaultValue)}`
          );
        }
        if (extraInfo.length > 0) {
          const extraDescription = `(${extraInfo.join(", ")})`;
          if (argument.description) {
            return `${argument.description} ${extraDescription}`;
          }
          return extraDescription;
        }
        return argument.description;
      }
      /**
       * Generate the built-in help text.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {string}
       */
      formatHelp(cmd, helper) {
        const termWidth = helper.padWidth(cmd, helper);
        const helpWidth = helper.helpWidth ?? 80;
        function callFormatItem(term, description) {
          return helper.formatItem(term, termWidth, description, helper);
        }
        let output = [
          `${helper.styleTitle("Usage:")} ${helper.styleUsage(helper.commandUsage(cmd))}`,
          ""
        ];
        const commandDescription = helper.commandDescription(cmd);
        if (commandDescription.length > 0) {
          output = output.concat([
            helper.boxWrap(
              helper.styleCommandDescription(commandDescription),
              helpWidth
            ),
            ""
          ]);
        }
        const argumentList = helper.visibleArguments(cmd).map((argument) => {
          return callFormatItem(
            helper.styleArgumentTerm(helper.argumentTerm(argument)),
            helper.styleArgumentDescription(helper.argumentDescription(argument))
          );
        });
        if (argumentList.length > 0) {
          output = output.concat([
            helper.styleTitle("Arguments:"),
            ...argumentList,
            ""
          ]);
        }
        const optionList = helper.visibleOptions(cmd).map((option) => {
          return callFormatItem(
            helper.styleOptionTerm(helper.optionTerm(option)),
            helper.styleOptionDescription(helper.optionDescription(option))
          );
        });
        if (optionList.length > 0) {
          output = output.concat([
            helper.styleTitle("Options:"),
            ...optionList,
            ""
          ]);
        }
        if (helper.showGlobalOptions) {
          const globalOptionList = helper.visibleGlobalOptions(cmd).map((option) => {
            return callFormatItem(
              helper.styleOptionTerm(helper.optionTerm(option)),
              helper.styleOptionDescription(helper.optionDescription(option))
            );
          });
          if (globalOptionList.length > 0) {
            output = output.concat([
              helper.styleTitle("Global Options:"),
              ...globalOptionList,
              ""
            ]);
          }
        }
        const commandList = helper.visibleCommands(cmd).map((cmd2) => {
          return callFormatItem(
            helper.styleSubcommandTerm(helper.subcommandTerm(cmd2)),
            helper.styleSubcommandDescription(helper.subcommandDescription(cmd2))
          );
        });
        if (commandList.length > 0) {
          output = output.concat([
            helper.styleTitle("Commands:"),
            ...commandList,
            ""
          ]);
        }
        return output.join("\n");
      }
      /**
       * Return display width of string, ignoring ANSI escape sequences. Used in padding and wrapping calculations.
       *
       * @param {string} str
       * @returns {number}
       */
      displayWidth(str) {
        return stripColor(str).length;
      }
      /**
       * Style the title for displaying in the help. Called with 'Usage:', 'Options:', etc.
       *
       * @param {string} str
       * @returns {string}
       */
      styleTitle(str) {
        return str;
      }
      styleUsage(str) {
        return str.split(" ").map((word) => {
          if (word === "[options]") return this.styleOptionText(word);
          if (word === "[command]") return this.styleSubcommandText(word);
          if (word[0] === "[" || word[0] === "<")
            return this.styleArgumentText(word);
          return this.styleCommandText(word);
        }).join(" ");
      }
      styleCommandDescription(str) {
        return this.styleDescriptionText(str);
      }
      styleOptionDescription(str) {
        return this.styleDescriptionText(str);
      }
      styleSubcommandDescription(str) {
        return this.styleDescriptionText(str);
      }
      styleArgumentDescription(str) {
        return this.styleDescriptionText(str);
      }
      styleDescriptionText(str) {
        return str;
      }
      styleOptionTerm(str) {
        return this.styleOptionText(str);
      }
      styleSubcommandTerm(str) {
        return str.split(" ").map((word) => {
          if (word === "[options]") return this.styleOptionText(word);
          if (word[0] === "[" || word[0] === "<")
            return this.styleArgumentText(word);
          return this.styleSubcommandText(word);
        }).join(" ");
      }
      styleArgumentTerm(str) {
        return this.styleArgumentText(str);
      }
      styleOptionText(str) {
        return str;
      }
      styleArgumentText(str) {
        return str;
      }
      styleSubcommandText(str) {
        return str;
      }
      styleCommandText(str) {
        return str;
      }
      /**
       * Calculate the pad width from the maximum term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      padWidth(cmd, helper) {
        return Math.max(
          helper.longestOptionTermLength(cmd, helper),
          helper.longestGlobalOptionTermLength(cmd, helper),
          helper.longestSubcommandTermLength(cmd, helper),
          helper.longestArgumentTermLength(cmd, helper)
        );
      }
      /**
       * Detect manually wrapped and indented strings by checking for line break followed by whitespace.
       *
       * @param {string} str
       * @returns {boolean}
       */
      preformatted(str) {
        return /\n[^\S\r\n]/.test(str);
      }
      /**
       * Format the "item", which consists of a term and description. Pad the term and wrap the description, indenting the following lines.
       *
       * So "TTT", 5, "DDD DDDD DD DDD" might be formatted for this.helpWidth=17 like so:
       *   TTT  DDD DDDD
       *        DD DDD
       *
       * @param {string} term
       * @param {number} termWidth
       * @param {string} description
       * @param {Help} helper
       * @returns {string}
       */
      formatItem(term, termWidth, description, helper) {
        const itemIndent = 2;
        const itemIndentStr = " ".repeat(itemIndent);
        if (!description) return itemIndentStr + term;
        const paddedTerm = term.padEnd(
          termWidth + term.length - helper.displayWidth(term)
        );
        const spacerWidth = 2;
        const helpWidth = this.helpWidth ?? 80;
        const remainingWidth = helpWidth - termWidth - spacerWidth - itemIndent;
        let formattedDescription;
        if (remainingWidth < this.minWidthToWrap || helper.preformatted(description)) {
          formattedDescription = description;
        } else {
          const wrappedDescription = helper.boxWrap(description, remainingWidth);
          formattedDescription = wrappedDescription.replace(
            /\n/g,
            "\n" + " ".repeat(termWidth + spacerWidth)
          );
        }
        return itemIndentStr + paddedTerm + " ".repeat(spacerWidth) + formattedDescription.replace(/\n/g, `
${itemIndentStr}`);
      }
      /**
       * Wrap a string at whitespace, preserving existing line breaks.
       * Wrapping is skipped if the width is less than `minWidthToWrap`.
       *
       * @param {string} str
       * @param {number} width
       * @returns {string}
       */
      boxWrap(str, width) {
        if (width < this.minWidthToWrap) return str;
        const rawLines = str.split(/\r\n|\n/);
        const chunkPattern = /[\s]*[^\s]+/g;
        const wrappedLines = [];
        rawLines.forEach((line) => {
          const chunks = line.match(chunkPattern);
          if (chunks === null) {
            wrappedLines.push("");
            return;
          }
          let sumChunks = [chunks.shift()];
          let sumWidth = this.displayWidth(sumChunks[0]);
          chunks.forEach((chunk) => {
            const visibleWidth = this.displayWidth(chunk);
            if (sumWidth + visibleWidth <= width) {
              sumChunks.push(chunk);
              sumWidth += visibleWidth;
              return;
            }
            wrappedLines.push(sumChunks.join(""));
            const nextChunk = chunk.trimStart();
            sumChunks = [nextChunk];
            sumWidth = this.displayWidth(nextChunk);
          });
          wrappedLines.push(sumChunks.join(""));
        });
        return wrappedLines.join("\n");
      }
    };
    function stripColor(str) {
      const sgrPattern = /\x1b\[\d*(;\d*)*m/g;
      return str.replace(sgrPattern, "");
    }
    exports.Help = Help2;
    exports.stripColor = stripColor;
  }
});

// node_modules/commander/lib/option.js
var require_option = __commonJS({
  "node_modules/commander/lib/option.js"(exports) {
    "use strict";
    var { InvalidArgumentError: InvalidArgumentError2 } = require_error();
    var Option2 = class {
      /**
       * Initialize a new `Option` with the given `flags` and `description`.
       *
       * @param {string} flags
       * @param {string} [description]
       */
      constructor(flags, description) {
        this.flags = flags;
        this.description = description || "";
        this.required = flags.includes("<");
        this.optional = flags.includes("[");
        this.variadic = /\w\.\.\.[>\]]$/.test(flags);
        this.mandatory = false;
        const optionFlags = splitOptionFlags(flags);
        this.short = optionFlags.shortFlag;
        this.long = optionFlags.longFlag;
        this.negate = false;
        if (this.long) {
          this.negate = this.long.startsWith("--no-");
        }
        this.defaultValue = void 0;
        this.defaultValueDescription = void 0;
        this.presetArg = void 0;
        this.envVar = void 0;
        this.parseArg = void 0;
        this.hidden = false;
        this.argChoices = void 0;
        this.conflictsWith = [];
        this.implied = void 0;
      }
      /**
       * Set the default value, and optionally supply the description to be displayed in the help.
       *
       * @param {*} value
       * @param {string} [description]
       * @return {Option}
       */
      default(value, description) {
        this.defaultValue = value;
        this.defaultValueDescription = description;
        return this;
      }
      /**
       * Preset to use when option used without option-argument, especially optional but also boolean and negated.
       * The custom processing (parseArg) is called.
       *
       * @example
       * new Option('--color').default('GREYSCALE').preset('RGB');
       * new Option('--donate [amount]').preset('20').argParser(parseFloat);
       *
       * @param {*} arg
       * @return {Option}
       */
      preset(arg) {
        this.presetArg = arg;
        return this;
      }
      /**
       * Add option name(s) that conflict with this option.
       * An error will be displayed if conflicting options are found during parsing.
       *
       * @example
       * new Option('--rgb').conflicts('cmyk');
       * new Option('--js').conflicts(['ts', 'jsx']);
       *
       * @param {(string | string[])} names
       * @return {Option}
       */
      conflicts(names) {
        this.conflictsWith = this.conflictsWith.concat(names);
        return this;
      }
      /**
       * Specify implied option values for when this option is set and the implied options are not.
       *
       * The custom processing (parseArg) is not called on the implied values.
       *
       * @example
       * program
       *   .addOption(new Option('--log', 'write logging information to file'))
       *   .addOption(new Option('--trace', 'log extra details').implies({ log: 'trace.txt' }));
       *
       * @param {object} impliedOptionValues
       * @return {Option}
       */
      implies(impliedOptionValues) {
        let newImplied = impliedOptionValues;
        if (typeof impliedOptionValues === "string") {
          newImplied = { [impliedOptionValues]: true };
        }
        this.implied = Object.assign(this.implied || {}, newImplied);
        return this;
      }
      /**
       * Set environment variable to check for option value.
       *
       * An environment variable is only used if when processed the current option value is
       * undefined, or the source of the current value is 'default' or 'config' or 'env'.
       *
       * @param {string} name
       * @return {Option}
       */
      env(name) {
        this.envVar = name;
        return this;
      }
      /**
       * Set the custom handler for processing CLI option arguments into option values.
       *
       * @param {Function} [fn]
       * @return {Option}
       */
      argParser(fn) {
        this.parseArg = fn;
        return this;
      }
      /**
       * Whether the option is mandatory and must have a value after parsing.
       *
       * @param {boolean} [mandatory=true]
       * @return {Option}
       */
      makeOptionMandatory(mandatory = true) {
        this.mandatory = !!mandatory;
        return this;
      }
      /**
       * Hide option in help.
       *
       * @param {boolean} [hide=true]
       * @return {Option}
       */
      hideHelp(hide = true) {
        this.hidden = !!hide;
        return this;
      }
      /**
       * @package
       */
      _concatValue(value, previous) {
        if (previous === this.defaultValue || !Array.isArray(previous)) {
          return [value];
        }
        return previous.concat(value);
      }
      /**
       * Only allow option value to be one of choices.
       *
       * @param {string[]} values
       * @return {Option}
       */
      choices(values) {
        this.argChoices = values.slice();
        this.parseArg = (arg, previous) => {
          if (!this.argChoices.includes(arg)) {
            throw new InvalidArgumentError2(
              `Allowed choices are ${this.argChoices.join(", ")}.`
            );
          }
          if (this.variadic) {
            return this._concatValue(arg, previous);
          }
          return arg;
        };
        return this;
      }
      /**
       * Return option name.
       *
       * @return {string}
       */
      name() {
        if (this.long) {
          return this.long.replace(/^--/, "");
        }
        return this.short.replace(/^-/, "");
      }
      /**
       * Return option name, in a camelcase format that can be used
       * as an object attribute key.
       *
       * @return {string}
       */
      attributeName() {
        if (this.negate) {
          return camelcase(this.name().replace(/^no-/, ""));
        }
        return camelcase(this.name());
      }
      /**
       * Check if `arg` matches the short or long flag.
       *
       * @param {string} arg
       * @return {boolean}
       * @package
       */
      is(arg) {
        return this.short === arg || this.long === arg;
      }
      /**
       * Return whether a boolean option.
       *
       * Options are one of boolean, negated, required argument, or optional argument.
       *
       * @return {boolean}
       * @package
       */
      isBoolean() {
        return !this.required && !this.optional && !this.negate;
      }
    };
    var DualOptions = class {
      /**
       * @param {Option[]} options
       */
      constructor(options) {
        this.positiveOptions = /* @__PURE__ */ new Map();
        this.negativeOptions = /* @__PURE__ */ new Map();
        this.dualOptions = /* @__PURE__ */ new Set();
        options.forEach((option) => {
          if (option.negate) {
            this.negativeOptions.set(option.attributeName(), option);
          } else {
            this.positiveOptions.set(option.attributeName(), option);
          }
        });
        this.negativeOptions.forEach((value, key) => {
          if (this.positiveOptions.has(key)) {
            this.dualOptions.add(key);
          }
        });
      }
      /**
       * Did the value come from the option, and not from possible matching dual option?
       *
       * @param {*} value
       * @param {Option} option
       * @returns {boolean}
       */
      valueFromOption(value, option) {
        const optionKey = option.attributeName();
        if (!this.dualOptions.has(optionKey)) return true;
        const preset = this.negativeOptions.get(optionKey).presetArg;
        const negativeValue = preset !== void 0 ? preset : false;
        return option.negate === (negativeValue === value);
      }
    };
    function camelcase(str) {
      return str.split("-").reduce((str2, word) => {
        return str2 + word[0].toUpperCase() + word.slice(1);
      });
    }
    function splitOptionFlags(flags) {
      let shortFlag;
      let longFlag;
      const shortFlagExp = /^-[^-]$/;
      const longFlagExp = /^--[^-]/;
      const flagParts = flags.split(/[ |,]+/).concat("guard");
      if (shortFlagExp.test(flagParts[0])) shortFlag = flagParts.shift();
      if (longFlagExp.test(flagParts[0])) longFlag = flagParts.shift();
      if (!shortFlag && shortFlagExp.test(flagParts[0]))
        shortFlag = flagParts.shift();
      if (!shortFlag && longFlagExp.test(flagParts[0])) {
        shortFlag = longFlag;
        longFlag = flagParts.shift();
      }
      if (flagParts[0].startsWith("-")) {
        const unsupportedFlag = flagParts[0];
        const baseError = `option creation failed due to '${unsupportedFlag}' in option flags '${flags}'`;
        if (/^-[^-][^-]/.test(unsupportedFlag))
          throw new Error(
            `${baseError}
- a short flag is a single dash and a single character
  - either use a single dash and a single character (for a short flag)
  - or use a double dash for a long option (and can have two, like '--ws, --workspace')`
          );
        if (shortFlagExp.test(unsupportedFlag))
          throw new Error(`${baseError}
- too many short flags`);
        if (longFlagExp.test(unsupportedFlag))
          throw new Error(`${baseError}
- too many long flags`);
        throw new Error(`${baseError}
- unrecognised flag format`);
      }
      if (shortFlag === void 0 && longFlag === void 0)
        throw new Error(
          `option creation failed due to no flags found in '${flags}'.`
        );
      return { shortFlag, longFlag };
    }
    exports.Option = Option2;
    exports.DualOptions = DualOptions;
  }
});

// node_modules/commander/lib/suggestSimilar.js
var require_suggestSimilar = __commonJS({
  "node_modules/commander/lib/suggestSimilar.js"(exports) {
    "use strict";
    var maxDistance = 3;
    function editDistance(a2, b2) {
      if (Math.abs(a2.length - b2.length) > maxDistance)
        return Math.max(a2.length, b2.length);
      const d2 = [];
      for (let i = 0; i <= a2.length; i++) {
        d2[i] = [i];
      }
      for (let j3 = 0; j3 <= b2.length; j3++) {
        d2[0][j3] = j3;
      }
      for (let j3 = 1; j3 <= b2.length; j3++) {
        for (let i = 1; i <= a2.length; i++) {
          let cost = 1;
          if (a2[i - 1] === b2[j3 - 1]) {
            cost = 0;
          } else {
            cost = 1;
          }
          d2[i][j3] = Math.min(
            d2[i - 1][j3] + 1,
            // deletion
            d2[i][j3 - 1] + 1,
            // insertion
            d2[i - 1][j3 - 1] + cost
            // substitution
          );
          if (i > 1 && j3 > 1 && a2[i - 1] === b2[j3 - 2] && a2[i - 2] === b2[j3 - 1]) {
            d2[i][j3] = Math.min(d2[i][j3], d2[i - 2][j3 - 2] + 1);
          }
        }
      }
      return d2[a2.length][b2.length];
    }
    function suggestSimilar(word, candidates) {
      if (!candidates || candidates.length === 0) return "";
      candidates = Array.from(new Set(candidates));
      const searchingOptions = word.startsWith("--");
      if (searchingOptions) {
        word = word.slice(2);
        candidates = candidates.map((candidate) => candidate.slice(2));
      }
      let similar = [];
      let bestDistance = maxDistance;
      const minSimilarity = 0.4;
      candidates.forEach((candidate) => {
        if (candidate.length <= 1) return;
        const distance = editDistance(word, candidate);
        const length = Math.max(word.length, candidate.length);
        const similarity = (length - distance) / length;
        if (similarity > minSimilarity) {
          if (distance < bestDistance) {
            bestDistance = distance;
            similar = [candidate];
          } else if (distance === bestDistance) {
            similar.push(candidate);
          }
        }
      });
      similar.sort((a2, b2) => a2.localeCompare(b2));
      if (searchingOptions) {
        similar = similar.map((candidate) => `--${candidate}`);
      }
      if (similar.length > 1) {
        return `
(Did you mean one of ${similar.join(", ")}?)`;
      }
      if (similar.length === 1) {
        return `
(Did you mean ${similar[0]}?)`;
      }
      return "";
    }
    exports.suggestSimilar = suggestSimilar;
  }
});

// node_modules/commander/lib/command.js
var require_command = __commonJS({
  "node_modules/commander/lib/command.js"(exports) {
    "use strict";
    var EventEmitter = __require("events").EventEmitter;
    var childProcess = __require("child_process");
    var path = __require("path");
    var fs = __require("fs");
    var process2 = __require("process");
    var { Argument: Argument2, humanReadableArgName } = require_argument();
    var { CommanderError: CommanderError2 } = require_error();
    var { Help: Help2, stripColor } = require_help();
    var { Option: Option2, DualOptions } = require_option();
    var { suggestSimilar } = require_suggestSimilar();
    var Command2 = class _Command extends EventEmitter {
      /**
       * Initialize a new `Command`.
       *
       * @param {string} [name]
       */
      constructor(name) {
        super();
        this.commands = [];
        this.options = [];
        this.parent = null;
        this._allowUnknownOption = false;
        this._allowExcessArguments = false;
        this.registeredArguments = [];
        this._args = this.registeredArguments;
        this.args = [];
        this.rawArgs = [];
        this.processedArgs = [];
        this._scriptPath = null;
        this._name = name || "";
        this._optionValues = {};
        this._optionValueSources = {};
        this._storeOptionsAsProperties = false;
        this._actionHandler = null;
        this._executableHandler = false;
        this._executableFile = null;
        this._executableDir = null;
        this._defaultCommandName = null;
        this._exitCallback = null;
        this._aliases = [];
        this._combineFlagAndOptionalValue = true;
        this._description = "";
        this._summary = "";
        this._argsDescription = void 0;
        this._enablePositionalOptions = false;
        this._passThroughOptions = false;
        this._lifeCycleHooks = {};
        this._showHelpAfterError = false;
        this._showSuggestionAfterError = true;
        this._savedState = null;
        this._outputConfiguration = {
          writeOut: (str) => process2.stdout.write(str),
          writeErr: (str) => process2.stderr.write(str),
          outputError: (str, write) => write(str),
          getOutHelpWidth: () => process2.stdout.isTTY ? process2.stdout.columns : void 0,
          getErrHelpWidth: () => process2.stderr.isTTY ? process2.stderr.columns : void 0,
          getOutHasColors: () => useColor() ?? (process2.stdout.isTTY && process2.stdout.hasColors?.()),
          getErrHasColors: () => useColor() ?? (process2.stderr.isTTY && process2.stderr.hasColors?.()),
          stripColor: (str) => stripColor(str)
        };
        this._hidden = false;
        this._helpOption = void 0;
        this._addImplicitHelpCommand = void 0;
        this._helpCommand = void 0;
        this._helpConfiguration = {};
      }
      /**
       * Copy settings that are useful to have in common across root command and subcommands.
       *
       * (Used internally when adding a command using `.command()` so subcommands inherit parent settings.)
       *
       * @param {Command} sourceCommand
       * @return {Command} `this` command for chaining
       */
      copyInheritedSettings(sourceCommand) {
        this._outputConfiguration = sourceCommand._outputConfiguration;
        this._helpOption = sourceCommand._helpOption;
        this._helpCommand = sourceCommand._helpCommand;
        this._helpConfiguration = sourceCommand._helpConfiguration;
        this._exitCallback = sourceCommand._exitCallback;
        this._storeOptionsAsProperties = sourceCommand._storeOptionsAsProperties;
        this._combineFlagAndOptionalValue = sourceCommand._combineFlagAndOptionalValue;
        this._allowExcessArguments = sourceCommand._allowExcessArguments;
        this._enablePositionalOptions = sourceCommand._enablePositionalOptions;
        this._showHelpAfterError = sourceCommand._showHelpAfterError;
        this._showSuggestionAfterError = sourceCommand._showSuggestionAfterError;
        return this;
      }
      /**
       * @returns {Command[]}
       * @private
       */
      _getCommandAndAncestors() {
        const result = [];
        for (let command = this; command; command = command.parent) {
          result.push(command);
        }
        return result;
      }
      /**
       * Define a command.
       *
       * There are two styles of command: pay attention to where to put the description.
       *
       * @example
       * // Command implemented using action handler (description is supplied separately to `.command`)
       * program
       *   .command('clone <source> [destination]')
       *   .description('clone a repository into a newly created directory')
       *   .action((source, destination) => {
       *     console.log('clone command called');
       *   });
       *
       * // Command implemented using separate executable file (description is second parameter to `.command`)
       * program
       *   .command('start <service>', 'start named service')
       *   .command('stop [service]', 'stop named service, or all if no name supplied');
       *
       * @param {string} nameAndArgs - command name and arguments, args are `<required>` or `[optional]` and last may also be `variadic...`
       * @param {(object | string)} [actionOptsOrExecDesc] - configuration options (for action), or description (for executable)
       * @param {object} [execOpts] - configuration options (for executable)
       * @return {Command} returns new command for action handler, or `this` for executable command
       */
      command(nameAndArgs, actionOptsOrExecDesc, execOpts) {
        let desc = actionOptsOrExecDesc;
        let opts = execOpts;
        if (typeof desc === "object" && desc !== null) {
          opts = desc;
          desc = null;
        }
        opts = opts || {};
        const [, name, args] = nameAndArgs.match(/([^ ]+) *(.*)/);
        const cmd = this.createCommand(name);
        if (desc) {
          cmd.description(desc);
          cmd._executableHandler = true;
        }
        if (opts.isDefault) this._defaultCommandName = cmd._name;
        cmd._hidden = !!(opts.noHelp || opts.hidden);
        cmd._executableFile = opts.executableFile || null;
        if (args) cmd.arguments(args);
        this._registerCommand(cmd);
        cmd.parent = this;
        cmd.copyInheritedSettings(this);
        if (desc) return this;
        return cmd;
      }
      /**
       * Factory routine to create a new unattached command.
       *
       * See .command() for creating an attached subcommand, which uses this routine to
       * create the command. You can override createCommand to customise subcommands.
       *
       * @param {string} [name]
       * @return {Command} new command
       */
      createCommand(name) {
        return new _Command(name);
      }
      /**
       * You can customise the help with a subclass of Help by overriding createHelp,
       * or by overriding Help properties using configureHelp().
       *
       * @return {Help}
       */
      createHelp() {
        return Object.assign(new Help2(), this.configureHelp());
      }
      /**
       * You can customise the help by overriding Help properties using configureHelp(),
       * or with a subclass of Help by overriding createHelp().
       *
       * @param {object} [configuration] - configuration options
       * @return {(Command | object)} `this` command for chaining, or stored configuration
       */
      configureHelp(configuration) {
        if (configuration === void 0) return this._helpConfiguration;
        this._helpConfiguration = configuration;
        return this;
      }
      /**
       * The default output goes to stdout and stderr. You can customise this for special
       * applications. You can also customise the display of errors by overriding outputError.
       *
       * The configuration properties are all functions:
       *
       *     // change how output being written, defaults to stdout and stderr
       *     writeOut(str)
       *     writeErr(str)
       *     // change how output being written for errors, defaults to writeErr
       *     outputError(str, write) // used for displaying errors and not used for displaying help
       *     // specify width for wrapping help
       *     getOutHelpWidth()
       *     getErrHelpWidth()
       *     // color support, currently only used with Help
       *     getOutHasColors()
       *     getErrHasColors()
       *     stripColor() // used to remove ANSI escape codes if output does not have colors
       *
       * @param {object} [configuration] - configuration options
       * @return {(Command | object)} `this` command for chaining, or stored configuration
       */
      configureOutput(configuration) {
        if (configuration === void 0) return this._outputConfiguration;
        Object.assign(this._outputConfiguration, configuration);
        return this;
      }
      /**
       * Display the help or a custom message after an error occurs.
       *
       * @param {(boolean|string)} [displayHelp]
       * @return {Command} `this` command for chaining
       */
      showHelpAfterError(displayHelp = true) {
        if (typeof displayHelp !== "string") displayHelp = !!displayHelp;
        this._showHelpAfterError = displayHelp;
        return this;
      }
      /**
       * Display suggestion of similar commands for unknown commands, or options for unknown options.
       *
       * @param {boolean} [displaySuggestion]
       * @return {Command} `this` command for chaining
       */
      showSuggestionAfterError(displaySuggestion = true) {
        this._showSuggestionAfterError = !!displaySuggestion;
        return this;
      }
      /**
       * Add a prepared subcommand.
       *
       * See .command() for creating an attached subcommand which inherits settings from its parent.
       *
       * @param {Command} cmd - new subcommand
       * @param {object} [opts] - configuration options
       * @return {Command} `this` command for chaining
       */
      addCommand(cmd, opts) {
        if (!cmd._name) {
          throw new Error(`Command passed to .addCommand() must have a name
- specify the name in Command constructor or using .name()`);
        }
        opts = opts || {};
        if (opts.isDefault) this._defaultCommandName = cmd._name;
        if (opts.noHelp || opts.hidden) cmd._hidden = true;
        this._registerCommand(cmd);
        cmd.parent = this;
        cmd._checkForBrokenPassThrough();
        return this;
      }
      /**
       * Factory routine to create a new unattached argument.
       *
       * See .argument() for creating an attached argument, which uses this routine to
       * create the argument. You can override createArgument to return a custom argument.
       *
       * @param {string} name
       * @param {string} [description]
       * @return {Argument} new argument
       */
      createArgument(name, description) {
        return new Argument2(name, description);
      }
      /**
       * Define argument syntax for command.
       *
       * The default is that the argument is required, and you can explicitly
       * indicate this with <> around the name. Put [] around the name for an optional argument.
       *
       * @example
       * program.argument('<input-file>');
       * program.argument('[output-file]');
       *
       * @param {string} name
       * @param {string} [description]
       * @param {(Function|*)} [fn] - custom argument processing function
       * @param {*} [defaultValue]
       * @return {Command} `this` command for chaining
       */
      argument(name, description, fn, defaultValue) {
        const argument = this.createArgument(name, description);
        if (typeof fn === "function") {
          argument.default(defaultValue).argParser(fn);
        } else {
          argument.default(fn);
        }
        this.addArgument(argument);
        return this;
      }
      /**
       * Define argument syntax for command, adding multiple at once (without descriptions).
       *
       * See also .argument().
       *
       * @example
       * program.arguments('<cmd> [env]');
       *
       * @param {string} names
       * @return {Command} `this` command for chaining
       */
      arguments(names) {
        names.trim().split(/ +/).forEach((detail) => {
          this.argument(detail);
        });
        return this;
      }
      /**
       * Define argument syntax for command, adding a prepared argument.
       *
       * @param {Argument} argument
       * @return {Command} `this` command for chaining
       */
      addArgument(argument) {
        const previousArgument = this.registeredArguments.slice(-1)[0];
        if (previousArgument && previousArgument.variadic) {
          throw new Error(
            `only the last argument can be variadic '${previousArgument.name()}'`
          );
        }
        if (argument.required && argument.defaultValue !== void 0 && argument.parseArg === void 0) {
          throw new Error(
            `a default value for a required argument is never used: '${argument.name()}'`
          );
        }
        this.registeredArguments.push(argument);
        return this;
      }
      /**
       * Customise or override default help command. By default a help command is automatically added if your command has subcommands.
       *
       * @example
       *    program.helpCommand('help [cmd]');
       *    program.helpCommand('help [cmd]', 'show help');
       *    program.helpCommand(false); // suppress default help command
       *    program.helpCommand(true); // add help command even if no subcommands
       *
       * @param {string|boolean} enableOrNameAndArgs - enable with custom name and/or arguments, or boolean to override whether added
       * @param {string} [description] - custom description
       * @return {Command} `this` command for chaining
       */
      helpCommand(enableOrNameAndArgs, description) {
        if (typeof enableOrNameAndArgs === "boolean") {
          this._addImplicitHelpCommand = enableOrNameAndArgs;
          return this;
        }
        enableOrNameAndArgs = enableOrNameAndArgs ?? "help [command]";
        const [, helpName, helpArgs] = enableOrNameAndArgs.match(/([^ ]+) *(.*)/);
        const helpDescription = description ?? "display help for command";
        const helpCommand = this.createCommand(helpName);
        helpCommand.helpOption(false);
        if (helpArgs) helpCommand.arguments(helpArgs);
        if (helpDescription) helpCommand.description(helpDescription);
        this._addImplicitHelpCommand = true;
        this._helpCommand = helpCommand;
        return this;
      }
      /**
       * Add prepared custom help command.
       *
       * @param {(Command|string|boolean)} helpCommand - custom help command, or deprecated enableOrNameAndArgs as for `.helpCommand()`
       * @param {string} [deprecatedDescription] - deprecated custom description used with custom name only
       * @return {Command} `this` command for chaining
       */
      addHelpCommand(helpCommand, deprecatedDescription) {
        if (typeof helpCommand !== "object") {
          this.helpCommand(helpCommand, deprecatedDescription);
          return this;
        }
        this._addImplicitHelpCommand = true;
        this._helpCommand = helpCommand;
        return this;
      }
      /**
       * Lazy create help command.
       *
       * @return {(Command|null)}
       * @package
       */
      _getHelpCommand() {
        const hasImplicitHelpCommand = this._addImplicitHelpCommand ?? (this.commands.length && !this._actionHandler && !this._findCommand("help"));
        if (hasImplicitHelpCommand) {
          if (this._helpCommand === void 0) {
            this.helpCommand(void 0, void 0);
          }
          return this._helpCommand;
        }
        return null;
      }
      /**
       * Add hook for life cycle event.
       *
       * @param {string} event
       * @param {Function} listener
       * @return {Command} `this` command for chaining
       */
      hook(event, listener) {
        const allowedValues = ["preSubcommand", "preAction", "postAction"];
        if (!allowedValues.includes(event)) {
          throw new Error(`Unexpected value for event passed to hook : '${event}'.
Expecting one of '${allowedValues.join("', '")}'`);
        }
        if (this._lifeCycleHooks[event]) {
          this._lifeCycleHooks[event].push(listener);
        } else {
          this._lifeCycleHooks[event] = [listener];
        }
        return this;
      }
      /**
       * Register callback to use as replacement for calling process.exit.
       *
       * @param {Function} [fn] optional callback which will be passed a CommanderError, defaults to throwing
       * @return {Command} `this` command for chaining
       */
      exitOverride(fn) {
        if (fn) {
          this._exitCallback = fn;
        } else {
          this._exitCallback = (err) => {
            if (err.code !== "commander.executeSubCommandAsync") {
              throw err;
            } else {
            }
          };
        }
        return this;
      }
      /**
       * Call process.exit, and _exitCallback if defined.
       *
       * @param {number} exitCode exit code for using with process.exit
       * @param {string} code an id string representing the error
       * @param {string} message human-readable description of the error
       * @return never
       * @private
       */
      _exit(exitCode, code, message) {
        if (this._exitCallback) {
          this._exitCallback(new CommanderError2(exitCode, code, message));
        }
        process2.exit(exitCode);
      }
      /**
       * Register callback `fn` for the command.
       *
       * @example
       * program
       *   .command('serve')
       *   .description('start service')
       *   .action(function() {
       *      // do work here
       *   });
       *
       * @param {Function} fn
       * @return {Command} `this` command for chaining
       */
      action(fn) {
        const listener = (args) => {
          const expectedArgsCount = this.registeredArguments.length;
          const actionArgs = args.slice(0, expectedArgsCount);
          if (this._storeOptionsAsProperties) {
            actionArgs[expectedArgsCount] = this;
          } else {
            actionArgs[expectedArgsCount] = this.opts();
          }
          actionArgs.push(this);
          return fn.apply(this, actionArgs);
        };
        this._actionHandler = listener;
        return this;
      }
      /**
       * Factory routine to create a new unattached option.
       *
       * See .option() for creating an attached option, which uses this routine to
       * create the option. You can override createOption to return a custom option.
       *
       * @param {string} flags
       * @param {string} [description]
       * @return {Option} new option
       */
      createOption(flags, description) {
        return new Option2(flags, description);
      }
      /**
       * Wrap parseArgs to catch 'commander.invalidArgument'.
       *
       * @param {(Option | Argument)} target
       * @param {string} value
       * @param {*} previous
       * @param {string} invalidArgumentMessage
       * @private
       */
      _callParseArg(target, value, previous, invalidArgumentMessage) {
        try {
          return target.parseArg(value, previous);
        } catch (err) {
          if (err.code === "commander.invalidArgument") {
            const message = `${invalidArgumentMessage} ${err.message}`;
            this.error(message, { exitCode: err.exitCode, code: err.code });
          }
          throw err;
        }
      }
      /**
       * Check for option flag conflicts.
       * Register option if no conflicts found, or throw on conflict.
       *
       * @param {Option} option
       * @private
       */
      _registerOption(option) {
        const matchingOption = option.short && this._findOption(option.short) || option.long && this._findOption(option.long);
        if (matchingOption) {
          const matchingFlag = option.long && this._findOption(option.long) ? option.long : option.short;
          throw new Error(`Cannot add option '${option.flags}'${this._name && ` to command '${this._name}'`} due to conflicting flag '${matchingFlag}'
-  already used by option '${matchingOption.flags}'`);
        }
        this.options.push(option);
      }
      /**
       * Check for command name and alias conflicts with existing commands.
       * Register command if no conflicts found, or throw on conflict.
       *
       * @param {Command} command
       * @private
       */
      _registerCommand(command) {
        const knownBy = (cmd) => {
          return [cmd.name()].concat(cmd.aliases());
        };
        const alreadyUsed = knownBy(command).find(
          (name) => this._findCommand(name)
        );
        if (alreadyUsed) {
          const existingCmd = knownBy(this._findCommand(alreadyUsed)).join("|");
          const newCmd = knownBy(command).join("|");
          throw new Error(
            `cannot add command '${newCmd}' as already have command '${existingCmd}'`
          );
        }
        this.commands.push(command);
      }
      /**
       * Add an option.
       *
       * @param {Option} option
       * @return {Command} `this` command for chaining
       */
      addOption(option) {
        this._registerOption(option);
        const oname = option.name();
        const name = option.attributeName();
        if (option.negate) {
          const positiveLongFlag = option.long.replace(/^--no-/, "--");
          if (!this._findOption(positiveLongFlag)) {
            this.setOptionValueWithSource(
              name,
              option.defaultValue === void 0 ? true : option.defaultValue,
              "default"
            );
          }
        } else if (option.defaultValue !== void 0) {
          this.setOptionValueWithSource(name, option.defaultValue, "default");
        }
        const handleOptionValue = (val, invalidValueMessage, valueSource) => {
          if (val == null && option.presetArg !== void 0) {
            val = option.presetArg;
          }
          const oldValue = this.getOptionValue(name);
          if (val !== null && option.parseArg) {
            val = this._callParseArg(option, val, oldValue, invalidValueMessage);
          } else if (val !== null && option.variadic) {
            val = option._concatValue(val, oldValue);
          }
          if (val == null) {
            if (option.negate) {
              val = false;
            } else if (option.isBoolean() || option.optional) {
              val = true;
            } else {
              val = "";
            }
          }
          this.setOptionValueWithSource(name, val, valueSource);
        };
        this.on("option:" + oname, (val) => {
          const invalidValueMessage = `error: option '${option.flags}' argument '${val}' is invalid.`;
          handleOptionValue(val, invalidValueMessage, "cli");
        });
        if (option.envVar) {
          this.on("optionEnv:" + oname, (val) => {
            const invalidValueMessage = `error: option '${option.flags}' value '${val}' from env '${option.envVar}' is invalid.`;
            handleOptionValue(val, invalidValueMessage, "env");
          });
        }
        return this;
      }
      /**
       * Internal implementation shared by .option() and .requiredOption()
       *
       * @return {Command} `this` command for chaining
       * @private
       */
      _optionEx(config, flags, description, fn, defaultValue) {
        if (typeof flags === "object" && flags instanceof Option2) {
          throw new Error(
            "To add an Option object use addOption() instead of option() or requiredOption()"
          );
        }
        const option = this.createOption(flags, description);
        option.makeOptionMandatory(!!config.mandatory);
        if (typeof fn === "function") {
          option.default(defaultValue).argParser(fn);
        } else if (fn instanceof RegExp) {
          const regex = fn;
          fn = (val, def) => {
            const m3 = regex.exec(val);
            return m3 ? m3[0] : def;
          };
          option.default(defaultValue).argParser(fn);
        } else {
          option.default(fn);
        }
        return this.addOption(option);
      }
      /**
       * Define option with `flags`, `description`, and optional argument parsing function or `defaultValue` or both.
       *
       * The `flags` string contains the short and/or long flags, separated by comma, a pipe or space. A required
       * option-argument is indicated by `<>` and an optional option-argument by `[]`.
       *
       * See the README for more details, and see also addOption() and requiredOption().
       *
       * @example
       * program
       *     .option('-p, --pepper', 'add pepper')
       *     .option('--pt, --pizza-type <TYPE>', 'type of pizza') // required option-argument
       *     .option('-c, --cheese [CHEESE]', 'add extra cheese', 'mozzarella') // optional option-argument with default
       *     .option('-t, --tip <VALUE>', 'add tip to purchase cost', parseFloat) // custom parse function
       *
       * @param {string} flags
       * @param {string} [description]
       * @param {(Function|*)} [parseArg] - custom option processing function or default value
       * @param {*} [defaultValue]
       * @return {Command} `this` command for chaining
       */
      option(flags, description, parseArg, defaultValue) {
        return this._optionEx({}, flags, description, parseArg, defaultValue);
      }
      /**
       * Add a required option which must have a value after parsing. This usually means
       * the option must be specified on the command line. (Otherwise the same as .option().)
       *
       * The `flags` string contains the short and/or long flags, separated by comma, a pipe or space.
       *
       * @param {string} flags
       * @param {string} [description]
       * @param {(Function|*)} [parseArg] - custom option processing function or default value
       * @param {*} [defaultValue]
       * @return {Command} `this` command for chaining
       */
      requiredOption(flags, description, parseArg, defaultValue) {
        return this._optionEx(
          { mandatory: true },
          flags,
          description,
          parseArg,
          defaultValue
        );
      }
      /**
       * Alter parsing of short flags with optional values.
       *
       * @example
       * // for `.option('-f,--flag [value]'):
       * program.combineFlagAndOptionalValue(true);  // `-f80` is treated like `--flag=80`, this is the default behaviour
       * program.combineFlagAndOptionalValue(false) // `-fb` is treated like `-f -b`
       *
       * @param {boolean} [combine] - if `true` or omitted, an optional value can be specified directly after the flag.
       * @return {Command} `this` command for chaining
       */
      combineFlagAndOptionalValue(combine = true) {
        this._combineFlagAndOptionalValue = !!combine;
        return this;
      }
      /**
       * Allow unknown options on the command line.
       *
       * @param {boolean} [allowUnknown] - if `true` or omitted, no error will be thrown for unknown options.
       * @return {Command} `this` command for chaining
       */
      allowUnknownOption(allowUnknown = true) {
        this._allowUnknownOption = !!allowUnknown;
        return this;
      }
      /**
       * Allow excess command-arguments on the command line. Pass false to make excess arguments an error.
       *
       * @param {boolean} [allowExcess] - if `true` or omitted, no error will be thrown for excess arguments.
       * @return {Command} `this` command for chaining
       */
      allowExcessArguments(allowExcess = true) {
        this._allowExcessArguments = !!allowExcess;
        return this;
      }
      /**
       * Enable positional options. Positional means global options are specified before subcommands which lets
       * subcommands reuse the same option names, and also enables subcommands to turn on passThroughOptions.
       * The default behaviour is non-positional and global options may appear anywhere on the command line.
       *
       * @param {boolean} [positional]
       * @return {Command} `this` command for chaining
       */
      enablePositionalOptions(positional = true) {
        this._enablePositionalOptions = !!positional;
        return this;
      }
      /**
       * Pass through options that come after command-arguments rather than treat them as command-options,
       * so actual command-options come before command-arguments. Turning this on for a subcommand requires
       * positional options to have been enabled on the program (parent commands).
       * The default behaviour is non-positional and options may appear before or after command-arguments.
       *
       * @param {boolean} [passThrough] for unknown options.
       * @return {Command} `this` command for chaining
       */
      passThroughOptions(passThrough = true) {
        this._passThroughOptions = !!passThrough;
        this._checkForBrokenPassThrough();
        return this;
      }
      /**
       * @private
       */
      _checkForBrokenPassThrough() {
        if (this.parent && this._passThroughOptions && !this.parent._enablePositionalOptions) {
          throw new Error(
            `passThroughOptions cannot be used for '${this._name}' without turning on enablePositionalOptions for parent command(s)`
          );
        }
      }
      /**
       * Whether to store option values as properties on command object,
       * or store separately (specify false). In both cases the option values can be accessed using .opts().
       *
       * @param {boolean} [storeAsProperties=true]
       * @return {Command} `this` command for chaining
       */
      storeOptionsAsProperties(storeAsProperties = true) {
        if (this.options.length) {
          throw new Error("call .storeOptionsAsProperties() before adding options");
        }
        if (Object.keys(this._optionValues).length) {
          throw new Error(
            "call .storeOptionsAsProperties() before setting option values"
          );
        }
        this._storeOptionsAsProperties = !!storeAsProperties;
        return this;
      }
      /**
       * Retrieve option value.
       *
       * @param {string} key
       * @return {object} value
       */
      getOptionValue(key) {
        if (this._storeOptionsAsProperties) {
          return this[key];
        }
        return this._optionValues[key];
      }
      /**
       * Store option value.
       *
       * @param {string} key
       * @param {object} value
       * @return {Command} `this` command for chaining
       */
      setOptionValue(key, value) {
        return this.setOptionValueWithSource(key, value, void 0);
      }
      /**
       * Store option value and where the value came from.
       *
       * @param {string} key
       * @param {object} value
       * @param {string} source - expected values are default/config/env/cli/implied
       * @return {Command} `this` command for chaining
       */
      setOptionValueWithSource(key, value, source) {
        if (this._storeOptionsAsProperties) {
          this[key] = value;
        } else {
          this._optionValues[key] = value;
        }
        this._optionValueSources[key] = source;
        return this;
      }
      /**
       * Get source of option value.
       * Expected values are default | config | env | cli | implied
       *
       * @param {string} key
       * @return {string}
       */
      getOptionValueSource(key) {
        return this._optionValueSources[key];
      }
      /**
       * Get source of option value. See also .optsWithGlobals().
       * Expected values are default | config | env | cli | implied
       *
       * @param {string} key
       * @return {string}
       */
      getOptionValueSourceWithGlobals(key) {
        let source;
        this._getCommandAndAncestors().forEach((cmd) => {
          if (cmd.getOptionValueSource(key) !== void 0) {
            source = cmd.getOptionValueSource(key);
          }
        });
        return source;
      }
      /**
       * Get user arguments from implied or explicit arguments.
       * Side-effects: set _scriptPath if args included script. Used for default program name, and subcommand searches.
       *
       * @private
       */
      _prepareUserArgs(argv, parseOptions) {
        if (argv !== void 0 && !Array.isArray(argv)) {
          throw new Error("first parameter to parse must be array or undefined");
        }
        parseOptions = parseOptions || {};
        if (argv === void 0 && parseOptions.from === void 0) {
          if (process2.versions?.electron) {
            parseOptions.from = "electron";
          }
          const execArgv = process2.execArgv ?? [];
          if (execArgv.includes("-e") || execArgv.includes("--eval") || execArgv.includes("-p") || execArgv.includes("--print")) {
            parseOptions.from = "eval";
          }
        }
        if (argv === void 0) {
          argv = process2.argv;
        }
        this.rawArgs = argv.slice();
        let userArgs;
        switch (parseOptions.from) {
          case void 0:
          case "node":
            this._scriptPath = argv[1];
            userArgs = argv.slice(2);
            break;
          case "electron":
            if (process2.defaultApp) {
              this._scriptPath = argv[1];
              userArgs = argv.slice(2);
            } else {
              userArgs = argv.slice(1);
            }
            break;
          case "user":
            userArgs = argv.slice(0);
            break;
          case "eval":
            userArgs = argv.slice(1);
            break;
          default:
            throw new Error(
              `unexpected parse option { from: '${parseOptions.from}' }`
            );
        }
        if (!this._name && this._scriptPath)
          this.nameFromFilename(this._scriptPath);
        this._name = this._name || "program";
        return userArgs;
      }
      /**
       * Parse `argv`, setting options and invoking commands when defined.
       *
       * Use parseAsync instead of parse if any of your action handlers are async.
       *
       * Call with no parameters to parse `process.argv`. Detects Electron and special node options like `node --eval`. Easy mode!
       *
       * Or call with an array of strings to parse, and optionally where the user arguments start by specifying where the arguments are `from`:
       * - `'node'`: default, `argv[0]` is the application and `argv[1]` is the script being run, with user arguments after that
       * - `'electron'`: `argv[0]` is the application and `argv[1]` varies depending on whether the electron application is packaged
       * - `'user'`: just user arguments
       *
       * @example
       * program.parse(); // parse process.argv and auto-detect electron and special node flags
       * program.parse(process.argv); // assume argv[0] is app and argv[1] is script
       * program.parse(my-args, { from: 'user' }); // just user supplied arguments, nothing special about argv[0]
       *
       * @param {string[]} [argv] - optional, defaults to process.argv
       * @param {object} [parseOptions] - optionally specify style of options with from: node/user/electron
       * @param {string} [parseOptions.from] - where the args are from: 'node', 'user', 'electron'
       * @return {Command} `this` command for chaining
       */
      parse(argv, parseOptions) {
        this._prepareForParse();
        const userArgs = this._prepareUserArgs(argv, parseOptions);
        this._parseCommand([], userArgs);
        return this;
      }
      /**
       * Parse `argv`, setting options and invoking commands when defined.
       *
       * Call with no parameters to parse `process.argv`. Detects Electron and special node options like `node --eval`. Easy mode!
       *
       * Or call with an array of strings to parse, and optionally where the user arguments start by specifying where the arguments are `from`:
       * - `'node'`: default, `argv[0]` is the application and `argv[1]` is the script being run, with user arguments after that
       * - `'electron'`: `argv[0]` is the application and `argv[1]` varies depending on whether the electron application is packaged
       * - `'user'`: just user arguments
       *
       * @example
       * await program.parseAsync(); // parse process.argv and auto-detect electron and special node flags
       * await program.parseAsync(process.argv); // assume argv[0] is app and argv[1] is script
       * await program.parseAsync(my-args, { from: 'user' }); // just user supplied arguments, nothing special about argv[0]
       *
       * @param {string[]} [argv]
       * @param {object} [parseOptions]
       * @param {string} parseOptions.from - where the args are from: 'node', 'user', 'electron'
       * @return {Promise}
       */
      async parseAsync(argv, parseOptions) {
        this._prepareForParse();
        const userArgs = this._prepareUserArgs(argv, parseOptions);
        await this._parseCommand([], userArgs);
        return this;
      }
      _prepareForParse() {
        if (this._savedState === null) {
          this.saveStateBeforeParse();
        } else {
          this.restoreStateBeforeParse();
        }
      }
      /**
       * Called the first time parse is called to save state and allow a restore before subsequent calls to parse.
       * Not usually called directly, but available for subclasses to save their custom state.
       *
       * This is called in a lazy way. Only commands used in parsing chain will have state saved.
       */
      saveStateBeforeParse() {
        this._savedState = {
          // name is stable if supplied by author, but may be unspecified for root command and deduced during parsing
          _name: this._name,
          // option values before parse have default values (including false for negated options)
          // shallow clones
          _optionValues: { ...this._optionValues },
          _optionValueSources: { ...this._optionValueSources }
        };
      }
      /**
       * Restore state before parse for calls after the first.
       * Not usually called directly, but available for subclasses to save their custom state.
       *
       * This is called in a lazy way. Only commands used in parsing chain will have state restored.
       */
      restoreStateBeforeParse() {
        if (this._storeOptionsAsProperties)
          throw new Error(`Can not call parse again when storeOptionsAsProperties is true.
- either make a new Command for each call to parse, or stop storing options as properties`);
        this._name = this._savedState._name;
        this._scriptPath = null;
        this.rawArgs = [];
        this._optionValues = { ...this._savedState._optionValues };
        this._optionValueSources = { ...this._savedState._optionValueSources };
        this.args = [];
        this.processedArgs = [];
      }
      /**
       * Throw if expected executable is missing. Add lots of help for author.
       *
       * @param {string} executableFile
       * @param {string} executableDir
       * @param {string} subcommandName
       */
      _checkForMissingExecutable(executableFile, executableDir, subcommandName) {
        if (fs.existsSync(executableFile)) return;
        const executableDirMessage = executableDir ? `searched for local subcommand relative to directory '${executableDir}'` : "no directory for search for local subcommand, use .executableDir() to supply a custom directory";
        const executableMissing = `'${executableFile}' does not exist
 - if '${subcommandName}' is not meant to be an executable command, remove description parameter from '.command()' and use '.description()' instead
 - if the default executable name is not suitable, use the executableFile option to supply a custom name or path
 - ${executableDirMessage}`;
        throw new Error(executableMissing);
      }
      /**
       * Execute a sub-command executable.
       *
       * @private
       */
      _executeSubCommand(subcommand, args) {
        args = args.slice();
        let launchWithNode = false;
        const sourceExt = [".js", ".ts", ".tsx", ".mjs", ".cjs"];
        function findFile(baseDir, baseName) {
          const localBin = path.resolve(baseDir, baseName);
          if (fs.existsSync(localBin)) return localBin;
          if (sourceExt.includes(path.extname(baseName))) return void 0;
          const foundExt = sourceExt.find(
            (ext) => fs.existsSync(`${localBin}${ext}`)
          );
          if (foundExt) return `${localBin}${foundExt}`;
          return void 0;
        }
        this._checkForMissingMandatoryOptions();
        this._checkForConflictingOptions();
        let executableFile = subcommand._executableFile || `${this._name}-${subcommand._name}`;
        let executableDir = this._executableDir || "";
        if (this._scriptPath) {
          let resolvedScriptPath;
          try {
            resolvedScriptPath = fs.realpathSync(this._scriptPath);
          } catch {
            resolvedScriptPath = this._scriptPath;
          }
          executableDir = path.resolve(
            path.dirname(resolvedScriptPath),
            executableDir
          );
        }
        if (executableDir) {
          let localFile = findFile(executableDir, executableFile);
          if (!localFile && !subcommand._executableFile && this._scriptPath) {
            const legacyName = path.basename(
              this._scriptPath,
              path.extname(this._scriptPath)
            );
            if (legacyName !== this._name) {
              localFile = findFile(
                executableDir,
                `${legacyName}-${subcommand._name}`
              );
            }
          }
          executableFile = localFile || executableFile;
        }
        launchWithNode = sourceExt.includes(path.extname(executableFile));
        let proc;
        if (process2.platform !== "win32") {
          if (launchWithNode) {
            args.unshift(executableFile);
            args = incrementNodeInspectorPort(process2.execArgv).concat(args);
            proc = childProcess.spawn(process2.argv[0], args, { stdio: "inherit" });
          } else {
            proc = childProcess.spawn(executableFile, args, { stdio: "inherit" });
          }
        } else {
          this._checkForMissingExecutable(
            executableFile,
            executableDir,
            subcommand._name
          );
          args.unshift(executableFile);
          args = incrementNodeInspectorPort(process2.execArgv).concat(args);
          proc = childProcess.spawn(process2.execPath, args, { stdio: "inherit" });
        }
        if (!proc.killed) {
          const signals = ["SIGUSR1", "SIGUSR2", "SIGTERM", "SIGINT", "SIGHUP"];
          signals.forEach((signal) => {
            process2.on(signal, () => {
              if (proc.killed === false && proc.exitCode === null) {
                proc.kill(signal);
              }
            });
          });
        }
        const exitCallback = this._exitCallback;
        proc.on("close", (code) => {
          code = code ?? 1;
          if (!exitCallback) {
            process2.exit(code);
          } else {
            exitCallback(
              new CommanderError2(
                code,
                "commander.executeSubCommandAsync",
                "(close)"
              )
            );
          }
        });
        proc.on("error", (err) => {
          if (err.code === "ENOENT") {
            this._checkForMissingExecutable(
              executableFile,
              executableDir,
              subcommand._name
            );
          } else if (err.code === "EACCES") {
            throw new Error(`'${executableFile}' not executable`);
          }
          if (!exitCallback) {
            process2.exit(1);
          } else {
            const wrappedError = new CommanderError2(
              1,
              "commander.executeSubCommandAsync",
              "(error)"
            );
            wrappedError.nestedError = err;
            exitCallback(wrappedError);
          }
        });
        this.runningCommand = proc;
      }
      /**
       * @private
       */
      _dispatchSubcommand(commandName, operands, unknown) {
        const subCommand = this._findCommand(commandName);
        if (!subCommand) this.help({ error: true });
        subCommand._prepareForParse();
        let promiseChain;
        promiseChain = this._chainOrCallSubCommandHook(
          promiseChain,
          subCommand,
          "preSubcommand"
        );
        promiseChain = this._chainOrCall(promiseChain, () => {
          if (subCommand._executableHandler) {
            this._executeSubCommand(subCommand, operands.concat(unknown));
          } else {
            return subCommand._parseCommand(operands, unknown);
          }
        });
        return promiseChain;
      }
      /**
       * Invoke help directly if possible, or dispatch if necessary.
       * e.g. help foo
       *
       * @private
       */
      _dispatchHelpCommand(subcommandName) {
        if (!subcommandName) {
          this.help();
        }
        const subCommand = this._findCommand(subcommandName);
        if (subCommand && !subCommand._executableHandler) {
          subCommand.help();
        }
        return this._dispatchSubcommand(
          subcommandName,
          [],
          [this._getHelpOption()?.long ?? this._getHelpOption()?.short ?? "--help"]
        );
      }
      /**
       * Check this.args against expected this.registeredArguments.
       *
       * @private
       */
      _checkNumberOfArguments() {
        this.registeredArguments.forEach((arg, i) => {
          if (arg.required && this.args[i] == null) {
            this.missingArgument(arg.name());
          }
        });
        if (this.registeredArguments.length > 0 && this.registeredArguments[this.registeredArguments.length - 1].variadic) {
          return;
        }
        if (this.args.length > this.registeredArguments.length) {
          this._excessArguments(this.args);
        }
      }
      /**
       * Process this.args using this.registeredArguments and save as this.processedArgs!
       *
       * @private
       */
      _processArguments() {
        const myParseArg = (argument, value, previous) => {
          let parsedValue = value;
          if (value !== null && argument.parseArg) {
            const invalidValueMessage = `error: command-argument value '${value}' is invalid for argument '${argument.name()}'.`;
            parsedValue = this._callParseArg(
              argument,
              value,
              previous,
              invalidValueMessage
            );
          }
          return parsedValue;
        };
        this._checkNumberOfArguments();
        const processedArgs = [];
        this.registeredArguments.forEach((declaredArg, index) => {
          let value = declaredArg.defaultValue;
          if (declaredArg.variadic) {
            if (index < this.args.length) {
              value = this.args.slice(index);
              if (declaredArg.parseArg) {
                value = value.reduce((processed, v2) => {
                  return myParseArg(declaredArg, v2, processed);
                }, declaredArg.defaultValue);
              }
            } else if (value === void 0) {
              value = [];
            }
          } else if (index < this.args.length) {
            value = this.args[index];
            if (declaredArg.parseArg) {
              value = myParseArg(declaredArg, value, declaredArg.defaultValue);
            }
          }
          processedArgs[index] = value;
        });
        this.processedArgs = processedArgs;
      }
      /**
       * Once we have a promise we chain, but call synchronously until then.
       *
       * @param {(Promise|undefined)} promise
       * @param {Function} fn
       * @return {(Promise|undefined)}
       * @private
       */
      _chainOrCall(promise, fn) {
        if (promise && promise.then && typeof promise.then === "function") {
          return promise.then(() => fn());
        }
        return fn();
      }
      /**
       *
       * @param {(Promise|undefined)} promise
       * @param {string} event
       * @return {(Promise|undefined)}
       * @private
       */
      _chainOrCallHooks(promise, event) {
        let result = promise;
        const hooks = [];
        this._getCommandAndAncestors().reverse().filter((cmd) => cmd._lifeCycleHooks[event] !== void 0).forEach((hookedCommand) => {
          hookedCommand._lifeCycleHooks[event].forEach((callback) => {
            hooks.push({ hookedCommand, callback });
          });
        });
        if (event === "postAction") {
          hooks.reverse();
        }
        hooks.forEach((hookDetail) => {
          result = this._chainOrCall(result, () => {
            return hookDetail.callback(hookDetail.hookedCommand, this);
          });
        });
        return result;
      }
      /**
       *
       * @param {(Promise|undefined)} promise
       * @param {Command} subCommand
       * @param {string} event
       * @return {(Promise|undefined)}
       * @private
       */
      _chainOrCallSubCommandHook(promise, subCommand, event) {
        let result = promise;
        if (this._lifeCycleHooks[event] !== void 0) {
          this._lifeCycleHooks[event].forEach((hook) => {
            result = this._chainOrCall(result, () => {
              return hook(this, subCommand);
            });
          });
        }
        return result;
      }
      /**
       * Process arguments in context of this command.
       * Returns action result, in case it is a promise.
       *
       * @private
       */
      _parseCommand(operands, unknown) {
        const parsed = this.parseOptions(unknown);
        this._parseOptionsEnv();
        this._parseOptionsImplied();
        operands = operands.concat(parsed.operands);
        unknown = parsed.unknown;
        this.args = operands.concat(unknown);
        if (operands && this._findCommand(operands[0])) {
          return this._dispatchSubcommand(operands[0], operands.slice(1), unknown);
        }
        if (this._getHelpCommand() && operands[0] === this._getHelpCommand().name()) {
          return this._dispatchHelpCommand(operands[1]);
        }
        if (this._defaultCommandName) {
          this._outputHelpIfRequested(unknown);
          return this._dispatchSubcommand(
            this._defaultCommandName,
            operands,
            unknown
          );
        }
        if (this.commands.length && this.args.length === 0 && !this._actionHandler && !this._defaultCommandName) {
          this.help({ error: true });
        }
        this._outputHelpIfRequested(parsed.unknown);
        this._checkForMissingMandatoryOptions();
        this._checkForConflictingOptions();
        const checkForUnknownOptions = () => {
          if (parsed.unknown.length > 0) {
            this.unknownOption(parsed.unknown[0]);
          }
        };
        const commandEvent = `command:${this.name()}`;
        if (this._actionHandler) {
          checkForUnknownOptions();
          this._processArguments();
          let promiseChain;
          promiseChain = this._chainOrCallHooks(promiseChain, "preAction");
          promiseChain = this._chainOrCall(
            promiseChain,
            () => this._actionHandler(this.processedArgs)
          );
          if (this.parent) {
            promiseChain = this._chainOrCall(promiseChain, () => {
              this.parent.emit(commandEvent, operands, unknown);
            });
          }
          promiseChain = this._chainOrCallHooks(promiseChain, "postAction");
          return promiseChain;
        }
        if (this.parent && this.parent.listenerCount(commandEvent)) {
          checkForUnknownOptions();
          this._processArguments();
          this.parent.emit(commandEvent, operands, unknown);
        } else if (operands.length) {
          if (this._findCommand("*")) {
            return this._dispatchSubcommand("*", operands, unknown);
          }
          if (this.listenerCount("command:*")) {
            this.emit("command:*", operands, unknown);
          } else if (this.commands.length) {
            this.unknownCommand();
          } else {
            checkForUnknownOptions();
            this._processArguments();
          }
        } else if (this.commands.length) {
          checkForUnknownOptions();
          this.help({ error: true });
        } else {
          checkForUnknownOptions();
          this._processArguments();
        }
      }
      /**
       * Find matching command.
       *
       * @private
       * @return {Command | undefined}
       */
      _findCommand(name) {
        if (!name) return void 0;
        return this.commands.find(
          (cmd) => cmd._name === name || cmd._aliases.includes(name)
        );
      }
      /**
       * Return an option matching `arg` if any.
       *
       * @param {string} arg
       * @return {Option}
       * @package
       */
      _findOption(arg) {
        return this.options.find((option) => option.is(arg));
      }
      /**
       * Display an error message if a mandatory option does not have a value.
       * Called after checking for help flags in leaf subcommand.
       *
       * @private
       */
      _checkForMissingMandatoryOptions() {
        this._getCommandAndAncestors().forEach((cmd) => {
          cmd.options.forEach((anOption) => {
            if (anOption.mandatory && cmd.getOptionValue(anOption.attributeName()) === void 0) {
              cmd.missingMandatoryOptionValue(anOption);
            }
          });
        });
      }
      /**
       * Display an error message if conflicting options are used together in this.
       *
       * @private
       */
      _checkForConflictingLocalOptions() {
        const definedNonDefaultOptions = this.options.filter((option) => {
          const optionKey = option.attributeName();
          if (this.getOptionValue(optionKey) === void 0) {
            return false;
          }
          return this.getOptionValueSource(optionKey) !== "default";
        });
        const optionsWithConflicting = definedNonDefaultOptions.filter(
          (option) => option.conflictsWith.length > 0
        );
        optionsWithConflicting.forEach((option) => {
          const conflictingAndDefined = definedNonDefaultOptions.find(
            (defined) => option.conflictsWith.includes(defined.attributeName())
          );
          if (conflictingAndDefined) {
            this._conflictingOption(option, conflictingAndDefined);
          }
        });
      }
      /**
       * Display an error message if conflicting options are used together.
       * Called after checking for help flags in leaf subcommand.
       *
       * @private
       */
      _checkForConflictingOptions() {
        this._getCommandAndAncestors().forEach((cmd) => {
          cmd._checkForConflictingLocalOptions();
        });
      }
      /**
       * Parse options from `argv` removing known options,
       * and return argv split into operands and unknown arguments.
       *
       * Side effects: modifies command by storing options. Does not reset state if called again.
       *
       * Examples:
       *
       *     argv => operands, unknown
       *     --known kkk op => [op], []
       *     op --known kkk => [op], []
       *     sub --unknown uuu op => [sub], [--unknown uuu op]
       *     sub -- --unknown uuu op => [sub --unknown uuu op], []
       *
       * @param {string[]} argv
       * @return {{operands: string[], unknown: string[]}}
       */
      parseOptions(argv) {
        const operands = [];
        const unknown = [];
        let dest = operands;
        const args = argv.slice();
        function maybeOption(arg) {
          return arg.length > 1 && arg[0] === "-";
        }
        let activeVariadicOption = null;
        while (args.length) {
          const arg = args.shift();
          if (arg === "--") {
            if (dest === unknown) dest.push(arg);
            dest.push(...args);
            break;
          }
          if (activeVariadicOption && !maybeOption(arg)) {
            this.emit(`option:${activeVariadicOption.name()}`, arg);
            continue;
          }
          activeVariadicOption = null;
          if (maybeOption(arg)) {
            const option = this._findOption(arg);
            if (option) {
              if (option.required) {
                const value = args.shift();
                if (value === void 0) this.optionMissingArgument(option);
                this.emit(`option:${option.name()}`, value);
              } else if (option.optional) {
                let value = null;
                if (args.length > 0 && !maybeOption(args[0])) {
                  value = args.shift();
                }
                this.emit(`option:${option.name()}`, value);
              } else {
                this.emit(`option:${option.name()}`);
              }
              activeVariadicOption = option.variadic ? option : null;
              continue;
            }
          }
          if (arg.length > 2 && arg[0] === "-" && arg[1] !== "-") {
            const option = this._findOption(`-${arg[1]}`);
            if (option) {
              if (option.required || option.optional && this._combineFlagAndOptionalValue) {
                this.emit(`option:${option.name()}`, arg.slice(2));
              } else {
                this.emit(`option:${option.name()}`);
                args.unshift(`-${arg.slice(2)}`);
              }
              continue;
            }
          }
          if (/^--[^=]+=/.test(arg)) {
            const index = arg.indexOf("=");
            const option = this._findOption(arg.slice(0, index));
            if (option && (option.required || option.optional)) {
              this.emit(`option:${option.name()}`, arg.slice(index + 1));
              continue;
            }
          }
          if (maybeOption(arg)) {
            dest = unknown;
          }
          if ((this._enablePositionalOptions || this._passThroughOptions) && operands.length === 0 && unknown.length === 0) {
            if (this._findCommand(arg)) {
              operands.push(arg);
              if (args.length > 0) unknown.push(...args);
              break;
            } else if (this._getHelpCommand() && arg === this._getHelpCommand().name()) {
              operands.push(arg);
              if (args.length > 0) operands.push(...args);
              break;
            } else if (this._defaultCommandName) {
              unknown.push(arg);
              if (args.length > 0) unknown.push(...args);
              break;
            }
          }
          if (this._passThroughOptions) {
            dest.push(arg);
            if (args.length > 0) dest.push(...args);
            break;
          }
          dest.push(arg);
        }
        return { operands, unknown };
      }
      /**
       * Return an object containing local option values as key-value pairs.
       *
       * @return {object}
       */
      opts() {
        if (this._storeOptionsAsProperties) {
          const result = {};
          const len = this.options.length;
          for (let i = 0; i < len; i++) {
            const key = this.options[i].attributeName();
            result[key] = key === this._versionOptionName ? this._version : this[key];
          }
          return result;
        }
        return this._optionValues;
      }
      /**
       * Return an object containing merged local and global option values as key-value pairs.
       *
       * @return {object}
       */
      optsWithGlobals() {
        return this._getCommandAndAncestors().reduce(
          (combinedOptions, cmd) => Object.assign(combinedOptions, cmd.opts()),
          {}
        );
      }
      /**
       * Display error message and exit (or call exitOverride).
       *
       * @param {string} message
       * @param {object} [errorOptions]
       * @param {string} [errorOptions.code] - an id string representing the error
       * @param {number} [errorOptions.exitCode] - used with process.exit
       */
      error(message, errorOptions) {
        this._outputConfiguration.outputError(
          `${message}
`,
          this._outputConfiguration.writeErr
        );
        if (typeof this._showHelpAfterError === "string") {
          this._outputConfiguration.writeErr(`${this._showHelpAfterError}
`);
        } else if (this._showHelpAfterError) {
          this._outputConfiguration.writeErr("\n");
          this.outputHelp({ error: true });
        }
        const config = errorOptions || {};
        const exitCode = config.exitCode || 1;
        const code = config.code || "commander.error";
        this._exit(exitCode, code, message);
      }
      /**
       * Apply any option related environment variables, if option does
       * not have a value from cli or client code.
       *
       * @private
       */
      _parseOptionsEnv() {
        this.options.forEach((option) => {
          if (option.envVar && option.envVar in process2.env) {
            const optionKey = option.attributeName();
            if (this.getOptionValue(optionKey) === void 0 || ["default", "config", "env"].includes(
              this.getOptionValueSource(optionKey)
            )) {
              if (option.required || option.optional) {
                this.emit(`optionEnv:${option.name()}`, process2.env[option.envVar]);
              } else {
                this.emit(`optionEnv:${option.name()}`);
              }
            }
          }
        });
      }
      /**
       * Apply any implied option values, if option is undefined or default value.
       *
       * @private
       */
      _parseOptionsImplied() {
        const dualHelper = new DualOptions(this.options);
        const hasCustomOptionValue = (optionKey) => {
          return this.getOptionValue(optionKey) !== void 0 && !["default", "implied"].includes(this.getOptionValueSource(optionKey));
        };
        this.options.filter(
          (option) => option.implied !== void 0 && hasCustomOptionValue(option.attributeName()) && dualHelper.valueFromOption(
            this.getOptionValue(option.attributeName()),
            option
          )
        ).forEach((option) => {
          Object.keys(option.implied).filter((impliedKey) => !hasCustomOptionValue(impliedKey)).forEach((impliedKey) => {
            this.setOptionValueWithSource(
              impliedKey,
              option.implied[impliedKey],
              "implied"
            );
          });
        });
      }
      /**
       * Argument `name` is missing.
       *
       * @param {string} name
       * @private
       */
      missingArgument(name) {
        const message = `error: missing required argument '${name}'`;
        this.error(message, { code: "commander.missingArgument" });
      }
      /**
       * `Option` is missing an argument.
       *
       * @param {Option} option
       * @private
       */
      optionMissingArgument(option) {
        const message = `error: option '${option.flags}' argument missing`;
        this.error(message, { code: "commander.optionMissingArgument" });
      }
      /**
       * `Option` does not have a value, and is a mandatory option.
       *
       * @param {Option} option
       * @private
       */
      missingMandatoryOptionValue(option) {
        const message = `error: required option '${option.flags}' not specified`;
        this.error(message, { code: "commander.missingMandatoryOptionValue" });
      }
      /**
       * `Option` conflicts with another option.
       *
       * @param {Option} option
       * @param {Option} conflictingOption
       * @private
       */
      _conflictingOption(option, conflictingOption) {
        const findBestOptionFromValue = (option2) => {
          const optionKey = option2.attributeName();
          const optionValue = this.getOptionValue(optionKey);
          const negativeOption = this.options.find(
            (target) => target.negate && optionKey === target.attributeName()
          );
          const positiveOption = this.options.find(
            (target) => !target.negate && optionKey === target.attributeName()
          );
          if (negativeOption && (negativeOption.presetArg === void 0 && optionValue === false || negativeOption.presetArg !== void 0 && optionValue === negativeOption.presetArg)) {
            return negativeOption;
          }
          return positiveOption || option2;
        };
        const getErrorMessage = (option2) => {
          const bestOption = findBestOptionFromValue(option2);
          const optionKey = bestOption.attributeName();
          const source = this.getOptionValueSource(optionKey);
          if (source === "env") {
            return `environment variable '${bestOption.envVar}'`;
          }
          return `option '${bestOption.flags}'`;
        };
        const message = `error: ${getErrorMessage(option)} cannot be used with ${getErrorMessage(conflictingOption)}`;
        this.error(message, { code: "commander.conflictingOption" });
      }
      /**
       * Unknown option `flag`.
       *
       * @param {string} flag
       * @private
       */
      unknownOption(flag) {
        if (this._allowUnknownOption) return;
        let suggestion = "";
        if (flag.startsWith("--") && this._showSuggestionAfterError) {
          let candidateFlags = [];
          let command = this;
          do {
            const moreFlags = command.createHelp().visibleOptions(command).filter((option) => option.long).map((option) => option.long);
            candidateFlags = candidateFlags.concat(moreFlags);
            command = command.parent;
          } while (command && !command._enablePositionalOptions);
          suggestion = suggestSimilar(flag, candidateFlags);
        }
        const message = `error: unknown option '${flag}'${suggestion}`;
        this.error(message, { code: "commander.unknownOption" });
      }
      /**
       * Excess arguments, more than expected.
       *
       * @param {string[]} receivedArgs
       * @private
       */
      _excessArguments(receivedArgs) {
        if (this._allowExcessArguments) return;
        const expected = this.registeredArguments.length;
        const s = expected === 1 ? "" : "s";
        const forSubcommand = this.parent ? ` for '${this.name()}'` : "";
        const message = `error: too many arguments${forSubcommand}. Expected ${expected} argument${s} but got ${receivedArgs.length}.`;
        this.error(message, { code: "commander.excessArguments" });
      }
      /**
       * Unknown command.
       *
       * @private
       */
      unknownCommand() {
        const unknownName = this.args[0];
        let suggestion = "";
        if (this._showSuggestionAfterError) {
          const candidateNames = [];
          this.createHelp().visibleCommands(this).forEach((command) => {
            candidateNames.push(command.name());
            if (command.alias()) candidateNames.push(command.alias());
          });
          suggestion = suggestSimilar(unknownName, candidateNames);
        }
        const message = `error: unknown command '${unknownName}'${suggestion}`;
        this.error(message, { code: "commander.unknownCommand" });
      }
      /**
       * Get or set the program version.
       *
       * This method auto-registers the "-V, --version" option which will print the version number.
       *
       * You can optionally supply the flags and description to override the defaults.
       *
       * @param {string} [str]
       * @param {string} [flags]
       * @param {string} [description]
       * @return {(this | string | undefined)} `this` command for chaining, or version string if no arguments
       */
      version(str, flags, description) {
        if (str === void 0) return this._version;
        this._version = str;
        flags = flags || "-V, --version";
        description = description || "output the version number";
        const versionOption = this.createOption(flags, description);
        this._versionOptionName = versionOption.attributeName();
        this._registerOption(versionOption);
        this.on("option:" + versionOption.name(), () => {
          this._outputConfiguration.writeOut(`${str}
`);
          this._exit(0, "commander.version", str);
        });
        return this;
      }
      /**
       * Set the description.
       *
       * @param {string} [str]
       * @param {object} [argsDescription]
       * @return {(string|Command)}
       */
      description(str, argsDescription) {
        if (str === void 0 && argsDescription === void 0)
          return this._description;
        this._description = str;
        if (argsDescription) {
          this._argsDescription = argsDescription;
        }
        return this;
      }
      /**
       * Set the summary. Used when listed as subcommand of parent.
       *
       * @param {string} [str]
       * @return {(string|Command)}
       */
      summary(str) {
        if (str === void 0) return this._summary;
        this._summary = str;
        return this;
      }
      /**
       * Set an alias for the command.
       *
       * You may call more than once to add multiple aliases. Only the first alias is shown in the auto-generated help.
       *
       * @param {string} [alias]
       * @return {(string|Command)}
       */
      alias(alias) {
        if (alias === void 0) return this._aliases[0];
        let command = this;
        if (this.commands.length !== 0 && this.commands[this.commands.length - 1]._executableHandler) {
          command = this.commands[this.commands.length - 1];
        }
        if (alias === command._name)
          throw new Error("Command alias can't be the same as its name");
        const matchingCommand = this.parent?._findCommand(alias);
        if (matchingCommand) {
          const existingCmd = [matchingCommand.name()].concat(matchingCommand.aliases()).join("|");
          throw new Error(
            `cannot add alias '${alias}' to command '${this.name()}' as already have command '${existingCmd}'`
          );
        }
        command._aliases.push(alias);
        return this;
      }
      /**
       * Set aliases for the command.
       *
       * Only the first alias is shown in the auto-generated help.
       *
       * @param {string[]} [aliases]
       * @return {(string[]|Command)}
       */
      aliases(aliases) {
        if (aliases === void 0) return this._aliases;
        aliases.forEach((alias) => this.alias(alias));
        return this;
      }
      /**
       * Set / get the command usage `str`.
       *
       * @param {string} [str]
       * @return {(string|Command)}
       */
      usage(str) {
        if (str === void 0) {
          if (this._usage) return this._usage;
          const args = this.registeredArguments.map((arg) => {
            return humanReadableArgName(arg);
          });
          return [].concat(
            this.options.length || this._helpOption !== null ? "[options]" : [],
            this.commands.length ? "[command]" : [],
            this.registeredArguments.length ? args : []
          ).join(" ");
        }
        this._usage = str;
        return this;
      }
      /**
       * Get or set the name of the command.
       *
       * @param {string} [str]
       * @return {(string|Command)}
       */
      name(str) {
        if (str === void 0) return this._name;
        this._name = str;
        return this;
      }
      /**
       * Set the name of the command from script filename, such as process.argv[1],
       * or require.main.filename, or __filename.
       *
       * (Used internally and public although not documented in README.)
       *
       * @example
       * program.nameFromFilename(require.main.filename);
       *
       * @param {string} filename
       * @return {Command}
       */
      nameFromFilename(filename) {
        this._name = path.basename(filename, path.extname(filename));
        return this;
      }
      /**
       * Get or set the directory for searching for executable subcommands of this command.
       *
       * @example
       * program.executableDir(__dirname);
       * // or
       * program.executableDir('subcommands');
       *
       * @param {string} [path]
       * @return {(string|null|Command)}
       */
      executableDir(path2) {
        if (path2 === void 0) return this._executableDir;
        this._executableDir = path2;
        return this;
      }
      /**
       * Return program help documentation.
       *
       * @param {{ error: boolean }} [contextOptions] - pass {error:true} to wrap for stderr instead of stdout
       * @return {string}
       */
      helpInformation(contextOptions) {
        const helper = this.createHelp();
        const context = this._getOutputContext(contextOptions);
        helper.prepareContext({
          error: context.error,
          helpWidth: context.helpWidth,
          outputHasColors: context.hasColors
        });
        const text = helper.formatHelp(this, helper);
        if (context.hasColors) return text;
        return this._outputConfiguration.stripColor(text);
      }
      /**
       * @typedef HelpContext
       * @type {object}
       * @property {boolean} error
       * @property {number} helpWidth
       * @property {boolean} hasColors
       * @property {function} write - includes stripColor if needed
       *
       * @returns {HelpContext}
       * @private
       */
      _getOutputContext(contextOptions) {
        contextOptions = contextOptions || {};
        const error = !!contextOptions.error;
        let baseWrite;
        let hasColors;
        let helpWidth;
        if (error) {
          baseWrite = (str) => this._outputConfiguration.writeErr(str);
          hasColors = this._outputConfiguration.getErrHasColors();
          helpWidth = this._outputConfiguration.getErrHelpWidth();
        } else {
          baseWrite = (str) => this._outputConfiguration.writeOut(str);
          hasColors = this._outputConfiguration.getOutHasColors();
          helpWidth = this._outputConfiguration.getOutHelpWidth();
        }
        const write = (str) => {
          if (!hasColors) str = this._outputConfiguration.stripColor(str);
          return baseWrite(str);
        };
        return { error, write, hasColors, helpWidth };
      }
      /**
       * Output help information for this command.
       *
       * Outputs built-in help, and custom text added using `.addHelpText()`.
       *
       * @param {{ error: boolean } | Function} [contextOptions] - pass {error:true} to write to stderr instead of stdout
       */
      outputHelp(contextOptions) {
        let deprecatedCallback;
        if (typeof contextOptions === "function") {
          deprecatedCallback = contextOptions;
          contextOptions = void 0;
        }
        const outputContext = this._getOutputContext(contextOptions);
        const eventContext = {
          error: outputContext.error,
          write: outputContext.write,
          command: this
        };
        this._getCommandAndAncestors().reverse().forEach((command) => command.emit("beforeAllHelp", eventContext));
        this.emit("beforeHelp", eventContext);
        let helpInformation = this.helpInformation({ error: outputContext.error });
        if (deprecatedCallback) {
          helpInformation = deprecatedCallback(helpInformation);
          if (typeof helpInformation !== "string" && !Buffer.isBuffer(helpInformation)) {
            throw new Error("outputHelp callback must return a string or a Buffer");
          }
        }
        outputContext.write(helpInformation);
        if (this._getHelpOption()?.long) {
          this.emit(this._getHelpOption().long);
        }
        this.emit("afterHelp", eventContext);
        this._getCommandAndAncestors().forEach(
          (command) => command.emit("afterAllHelp", eventContext)
        );
      }
      /**
       * You can pass in flags and a description to customise the built-in help option.
       * Pass in false to disable the built-in help option.
       *
       * @example
       * program.helpOption('-?, --help' 'show help'); // customise
       * program.helpOption(false); // disable
       *
       * @param {(string | boolean)} flags
       * @param {string} [description]
       * @return {Command} `this` command for chaining
       */
      helpOption(flags, description) {
        if (typeof flags === "boolean") {
          if (flags) {
            this._helpOption = this._helpOption ?? void 0;
          } else {
            this._helpOption = null;
          }
          return this;
        }
        flags = flags ?? "-h, --help";
        description = description ?? "display help for command";
        this._helpOption = this.createOption(flags, description);
        return this;
      }
      /**
       * Lazy create help option.
       * Returns null if has been disabled with .helpOption(false).
       *
       * @returns {(Option | null)} the help option
       * @package
       */
      _getHelpOption() {
        if (this._helpOption === void 0) {
          this.helpOption(void 0, void 0);
        }
        return this._helpOption;
      }
      /**
       * Supply your own option to use for the built-in help option.
       * This is an alternative to using helpOption() to customise the flags and description etc.
       *
       * @param {Option} option
       * @return {Command} `this` command for chaining
       */
      addHelpOption(option) {
        this._helpOption = option;
        return this;
      }
      /**
       * Output help information and exit.
       *
       * Outputs built-in help, and custom text added using `.addHelpText()`.
       *
       * @param {{ error: boolean }} [contextOptions] - pass {error:true} to write to stderr instead of stdout
       */
      help(contextOptions) {
        this.outputHelp(contextOptions);
        let exitCode = Number(process2.exitCode ?? 0);
        if (exitCode === 0 && contextOptions && typeof contextOptions !== "function" && contextOptions.error) {
          exitCode = 1;
        }
        this._exit(exitCode, "commander.help", "(outputHelp)");
      }
      /**
       * // Do a little typing to coordinate emit and listener for the help text events.
       * @typedef HelpTextEventContext
       * @type {object}
       * @property {boolean} error
       * @property {Command} command
       * @property {function} write
       */
      /**
       * Add additional text to be displayed with the built-in help.
       *
       * Position is 'before' or 'after' to affect just this command,
       * and 'beforeAll' or 'afterAll' to affect this command and all its subcommands.
       *
       * @param {string} position - before or after built-in help
       * @param {(string | Function)} text - string to add, or a function returning a string
       * @return {Command} `this` command for chaining
       */
      addHelpText(position, text) {
        const allowedValues = ["beforeAll", "before", "after", "afterAll"];
        if (!allowedValues.includes(position)) {
          throw new Error(`Unexpected value for position to addHelpText.
Expecting one of '${allowedValues.join("', '")}'`);
        }
        const helpEvent = `${position}Help`;
        this.on(helpEvent, (context) => {
          let helpStr;
          if (typeof text === "function") {
            helpStr = text({ error: context.error, command: context.command });
          } else {
            helpStr = text;
          }
          if (helpStr) {
            context.write(`${helpStr}
`);
          }
        });
        return this;
      }
      /**
       * Output help information if help flags specified
       *
       * @param {Array} args - array of options to search for help flags
       * @private
       */
      _outputHelpIfRequested(args) {
        const helpOption = this._getHelpOption();
        const helpRequested = helpOption && args.find((arg) => helpOption.is(arg));
        if (helpRequested) {
          this.outputHelp();
          this._exit(0, "commander.helpDisplayed", "(outputHelp)");
        }
      }
    };
    function incrementNodeInspectorPort(args) {
      return args.map((arg) => {
        if (!arg.startsWith("--inspect")) {
          return arg;
        }
        let debugOption;
        let debugHost = "127.0.0.1";
        let debugPort = "9229";
        let match;
        if ((match = arg.match(/^(--inspect(-brk)?)$/)) !== null) {
          debugOption = match[1];
        } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+)$/)) !== null) {
          debugOption = match[1];
          if (/^\d+$/.test(match[3])) {
            debugPort = match[3];
          } else {
            debugHost = match[3];
          }
        } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+):(\d+)$/)) !== null) {
          debugOption = match[1];
          debugHost = match[3];
          debugPort = match[4];
        }
        if (debugOption && debugPort !== "0") {
          return `${debugOption}=${debugHost}:${parseInt(debugPort) + 1}`;
        }
        return arg;
      });
    }
    function useColor() {
      if (process2.env.NO_COLOR || process2.env.FORCE_COLOR === "0" || process2.env.FORCE_COLOR === "false")
        return false;
      if (process2.env.FORCE_COLOR || process2.env.CLICOLOR_FORCE !== void 0)
        return true;
      return void 0;
    }
    exports.Command = Command2;
    exports.useColor = useColor;
  }
});

// node_modules/commander/index.js
var require_commander = __commonJS({
  "node_modules/commander/index.js"(exports) {
    "use strict";
    var { Argument: Argument2 } = require_argument();
    var { Command: Command2 } = require_command();
    var { CommanderError: CommanderError2, InvalidArgumentError: InvalidArgumentError2 } = require_error();
    var { Help: Help2 } = require_help();
    var { Option: Option2 } = require_option();
    exports.program = new Command2();
    exports.createCommand = (name) => new Command2(name);
    exports.createOption = (flags, description) => new Option2(flags, description);
    exports.createArgument = (name, description) => new Argument2(name, description);
    exports.Command = Command2;
    exports.Option = Option2;
    exports.Argument = Argument2;
    exports.Help = Help2;
    exports.CommanderError = CommanderError2;
    exports.InvalidArgumentError = InvalidArgumentError2;
    exports.InvalidOptionArgumentError = InvalidArgumentError2;
  }
});

// node_modules/picocolors/picocolors.js
var require_picocolors = __commonJS({
  "node_modules/picocolors/picocolors.js"(exports, module) {
    "use strict";
    var p2 = process || {};
    var argv = p2.argv || [];
    var env = p2.env || {};
    var isColorSupported = !(!!env.NO_COLOR || argv.includes("--no-color")) && (!!env.FORCE_COLOR || argv.includes("--color") || p2.platform === "win32" || (p2.stdout || {}).isTTY && env.TERM !== "dumb" || !!env.CI);
    var formatter = (open, close, replace = open) => (input) => {
      let string = "" + input, index = string.indexOf(close, open.length);
      return ~index ? open + replaceClose(string, close, replace, index) + close : open + string + close;
    };
    var replaceClose = (string, close, replace, index) => {
      let result = "", cursor = 0;
      do {
        result += string.substring(cursor, index) + replace;
        cursor = index + close.length;
        index = string.indexOf(close, cursor);
      } while (~index);
      return result + string.substring(cursor);
    };
    var createColors = (enabled = isColorSupported) => {
      let f2 = enabled ? formatter : () => String;
      return {
        isColorSupported: enabled,
        reset: f2("\x1B[0m", "\x1B[0m"),
        bold: f2("\x1B[1m", "\x1B[22m", "\x1B[22m\x1B[1m"),
        dim: f2("\x1B[2m", "\x1B[22m", "\x1B[22m\x1B[2m"),
        italic: f2("\x1B[3m", "\x1B[23m"),
        underline: f2("\x1B[4m", "\x1B[24m"),
        inverse: f2("\x1B[7m", "\x1B[27m"),
        hidden: f2("\x1B[8m", "\x1B[28m"),
        strikethrough: f2("\x1B[9m", "\x1B[29m"),
        black: f2("\x1B[30m", "\x1B[39m"),
        red: f2("\x1B[31m", "\x1B[39m"),
        green: f2("\x1B[32m", "\x1B[39m"),
        yellow: f2("\x1B[33m", "\x1B[39m"),
        blue: f2("\x1B[34m", "\x1B[39m"),
        magenta: f2("\x1B[35m", "\x1B[39m"),
        cyan: f2("\x1B[36m", "\x1B[39m"),
        white: f2("\x1B[37m", "\x1B[39m"),
        gray: f2("\x1B[90m", "\x1B[39m"),
        bgBlack: f2("\x1B[40m", "\x1B[49m"),
        bgRed: f2("\x1B[41m", "\x1B[49m"),
        bgGreen: f2("\x1B[42m", "\x1B[49m"),
        bgYellow: f2("\x1B[43m", "\x1B[49m"),
        bgBlue: f2("\x1B[44m", "\x1B[49m"),
        bgMagenta: f2("\x1B[45m", "\x1B[49m"),
        bgCyan: f2("\x1B[46m", "\x1B[49m"),
        bgWhite: f2("\x1B[47m", "\x1B[49m"),
        blackBright: f2("\x1B[90m", "\x1B[39m"),
        redBright: f2("\x1B[91m", "\x1B[39m"),
        greenBright: f2("\x1B[92m", "\x1B[39m"),
        yellowBright: f2("\x1B[93m", "\x1B[39m"),
        blueBright: f2("\x1B[94m", "\x1B[39m"),
        magentaBright: f2("\x1B[95m", "\x1B[39m"),
        cyanBright: f2("\x1B[96m", "\x1B[39m"),
        whiteBright: f2("\x1B[97m", "\x1B[39m"),
        bgBlackBright: f2("\x1B[100m", "\x1B[49m"),
        bgRedBright: f2("\x1B[101m", "\x1B[49m"),
        bgGreenBright: f2("\x1B[102m", "\x1B[49m"),
        bgYellowBright: f2("\x1B[103m", "\x1B[49m"),
        bgBlueBright: f2("\x1B[104m", "\x1B[49m"),
        bgMagentaBright: f2("\x1B[105m", "\x1B[49m"),
        bgCyanBright: f2("\x1B[106m", "\x1B[49m"),
        bgWhiteBright: f2("\x1B[107m", "\x1B[49m")
      };
    };
    module.exports = createColors();
    module.exports.createColors = createColors;
  }
});

// node_modules/sisteransi/src/index.js
var require_src = __commonJS({
  "node_modules/sisteransi/src/index.js"(exports, module) {
    "use strict";
    var ESC = "\x1B";
    var CSI = `${ESC}[`;
    var beep = "\x07";
    var cursor = {
      to(x2, y3) {
        if (!y3) return `${CSI}${x2 + 1}G`;
        return `${CSI}${y3 + 1};${x2 + 1}H`;
      },
      move(x2, y3) {
        let ret = "";
        if (x2 < 0) ret += `${CSI}${-x2}D`;
        else if (x2 > 0) ret += `${CSI}${x2}C`;
        if (y3 < 0) ret += `${CSI}${-y3}A`;
        else if (y3 > 0) ret += `${CSI}${y3}B`;
        return ret;
      },
      up: (count = 1) => `${CSI}${count}A`,
      down: (count = 1) => `${CSI}${count}B`,
      forward: (count = 1) => `${CSI}${count}C`,
      backward: (count = 1) => `${CSI}${count}D`,
      nextLine: (count = 1) => `${CSI}E`.repeat(count),
      prevLine: (count = 1) => `${CSI}F`.repeat(count),
      left: `${CSI}G`,
      hide: `${CSI}?25l`,
      show: `${CSI}?25h`,
      save: `${ESC}7`,
      restore: `${ESC}8`
    };
    var scroll = {
      up: (count = 1) => `${CSI}S`.repeat(count),
      down: (count = 1) => `${CSI}T`.repeat(count)
    };
    var erase = {
      screen: `${CSI}2J`,
      up: (count = 1) => `${CSI}1J`.repeat(count),
      down: (count = 1) => `${CSI}J`.repeat(count),
      line: `${CSI}2K`,
      lineEnd: `${CSI}K`,
      lineStart: `${CSI}1K`,
      lines(count) {
        let clear = "";
        for (let i = 0; i < count; i++)
          clear += this.line + (i < count - 1 ? cursor.up() : "");
        if (count)
          clear += cursor.left;
        return clear;
      }
    };
    module.exports = { cursor, scroll, erase, beep };
  }
});

// node_modules/commander/esm.mjs
var import_index = __toESM(require_commander(), 1);
var {
  program,
  createCommand,
  createArgument,
  createOption,
  CommanderError,
  InvalidArgumentError,
  InvalidOptionArgumentError,
  // deprecated old name
  Command,
  Argument,
  Option,
  Help
} = import_index.default;

// src/ui/banner.ts
var import_picocolors = __toESM(require_picocolors(), 1);
var VERSION = "1.0.0";
function printBanner() {
  console.log("");
  console.log(import_picocolors.default.bold(import_picocolors.default.cyan(`   _____ _                 _        `)));
  console.log(import_picocolors.default.bold(import_picocolors.default.cyan(`  / ____| |               | |       `)));
  console.log(import_picocolors.default.bold(import_picocolors.default.cyan(` | |    | | __ _ _   _  __| | ___   `)));
  console.log(import_picocolors.default.bold(import_picocolors.default.cyan(` | |    | |/ _\` | | | |/ _\` |/ _ \\  `)));
  console.log(import_picocolors.default.bold(import_picocolors.default.cyan(` | |____| | (_| | |_| | (_| |  __/  `)));
  console.log(import_picocolors.default.bold(import_picocolors.default.cyan(`  \\_____|_|\\__,_|\\__,_|\\__,_|\\___|  `)));
  console.log(import_picocolors.default.bold(import_picocolors.default.cyan(`                                     `)));
  console.log(`  ${import_picocolors.default.yellow("S U P E R P O W E R S")}`);
  console.log(`  ${import_picocolors.default.dim(`v${VERSION} \u2014 Smart skill installer for Claude Code`)}`);
  console.log("");
  console.log(`  ${import_picocolors.default.dim("by Daniel Dragolea <dragolea@yahoo.com>")}`);
  console.log("");
}
function getVersion() {
  return VERSION;
}

// src/ui/format.ts
var import_picocolors2 = __toESM(require_picocolors(), 1);
var theme = {
  error: import_picocolors2.default.red,
  success: import_picocolors2.default.green,
  warn: import_picocolors2.default.yellow,
  info: import_picocolors2.default.blue,
  accent: import_picocolors2.default.cyan,
  bold: import_picocolors2.default.bold,
  dim: import_picocolors2.default.dim,
  heading: (s) => import_picocolors2.default.bold(import_picocolors2.default.cyan(s)),
  separator: () => import_picocolors2.default.bold("\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500")
};

// src/skills-bridge/installed.ts
import { readdir, readFile } from "fs/promises";
import { join } from "path";
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match?.[1]) return {};
  const result = {};
  for (const line of match[1].split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    if (key) result[key] = value;
  }
  return result;
}
async function scanSkillsDir(dir) {
  let entries;
  try {
    entries = await readdir(dir);
  } catch {
    return [];
  }
  const skills = [];
  for (const entry of entries) {
    const skillMdPath = join(dir, entry, "SKILL.md");
    try {
      const content = await readFile(skillMdPath, "utf-8");
      const fm = parseFrontmatter(content);
      skills.push({
        name: fm.name || entry,
        description: fm.description || "",
        path: skillMdPath
      });
    } catch {
    }
  }
  return skills;
}
async function getInstalledSkillMetadata(cwd) {
  const skillsDir = join(cwd, ".claude", "skills");
  return scanSkillsDir(skillsDir);
}

// src/commands/list.ts
async function cmdList() {
  const cwd = process.cwd();
  const skills = await getInstalledSkillMetadata(cwd);
  if (skills.length === 0) {
    console.log("");
    console.log(theme.warn("No skills installed in this project."));
    console.log(theme.dim("Run npx superpower-installer to install skills."));
    console.log("");
    return;
  }
  console.log("");
  console.log(theme.bold(`Installed Skills (${skills.length})`));
  console.log("");
  for (const skill of skills) {
    console.log(`  ${theme.bold(skill.name)}`);
    console.log(`  ${theme.dim(skill.description)}`);
    console.log(`  ${theme.dim(skill.path)}`);
    console.log("");
  }
}

// node_modules/@clack/prompts/dist/index.mjs
import { stripVTControlCharacters as T2 } from "util";

// node_modules/@clack/prompts/node_modules/@clack/core/dist/index.mjs
var import_sisteransi = __toESM(require_src(), 1);
import { stdin as $, stdout as j } from "process";
import * as f from "readline";
import M from "readline";
import { WriteStream as U } from "tty";
function J({ onlyFirst: t = false } = {}) {
  const F = ["[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?(?:\\u0007|\\u001B\\u005C|\\u009C))", "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))"].join("|");
  return new RegExp(F, t ? void 0 : "g");
}
var Q = J();
function T(t) {
  if (typeof t != "string") throw new TypeError(`Expected a \`string\`, got \`${typeof t}\``);
  return t.replace(Q, "");
}
function O(t) {
  return t && t.__esModule && Object.prototype.hasOwnProperty.call(t, "default") ? t.default : t;
}
var P = { exports: {} };
(function(t) {
  var u2 = {};
  t.exports = u2, u2.eastAsianWidth = function(e2) {
    var s = e2.charCodeAt(0), i = e2.length == 2 ? e2.charCodeAt(1) : 0, D = s;
    return 55296 <= s && s <= 56319 && 56320 <= i && i <= 57343 && (s &= 1023, i &= 1023, D = s << 10 | i, D += 65536), D == 12288 || 65281 <= D && D <= 65376 || 65504 <= D && D <= 65510 ? "F" : D == 8361 || 65377 <= D && D <= 65470 || 65474 <= D && D <= 65479 || 65482 <= D && D <= 65487 || 65490 <= D && D <= 65495 || 65498 <= D && D <= 65500 || 65512 <= D && D <= 65518 ? "H" : 4352 <= D && D <= 4447 || 4515 <= D && D <= 4519 || 4602 <= D && D <= 4607 || 9001 <= D && D <= 9002 || 11904 <= D && D <= 11929 || 11931 <= D && D <= 12019 || 12032 <= D && D <= 12245 || 12272 <= D && D <= 12283 || 12289 <= D && D <= 12350 || 12353 <= D && D <= 12438 || 12441 <= D && D <= 12543 || 12549 <= D && D <= 12589 || 12593 <= D && D <= 12686 || 12688 <= D && D <= 12730 || 12736 <= D && D <= 12771 || 12784 <= D && D <= 12830 || 12832 <= D && D <= 12871 || 12880 <= D && D <= 13054 || 13056 <= D && D <= 19903 || 19968 <= D && D <= 42124 || 42128 <= D && D <= 42182 || 43360 <= D && D <= 43388 || 44032 <= D && D <= 55203 || 55216 <= D && D <= 55238 || 55243 <= D && D <= 55291 || 63744 <= D && D <= 64255 || 65040 <= D && D <= 65049 || 65072 <= D && D <= 65106 || 65108 <= D && D <= 65126 || 65128 <= D && D <= 65131 || 110592 <= D && D <= 110593 || 127488 <= D && D <= 127490 || 127504 <= D && D <= 127546 || 127552 <= D && D <= 127560 || 127568 <= D && D <= 127569 || 131072 <= D && D <= 194367 || 177984 <= D && D <= 196605 || 196608 <= D && D <= 262141 ? "W" : 32 <= D && D <= 126 || 162 <= D && D <= 163 || 165 <= D && D <= 166 || D == 172 || D == 175 || 10214 <= D && D <= 10221 || 10629 <= D && D <= 10630 ? "Na" : D == 161 || D == 164 || 167 <= D && D <= 168 || D == 170 || 173 <= D && D <= 174 || 176 <= D && D <= 180 || 182 <= D && D <= 186 || 188 <= D && D <= 191 || D == 198 || D == 208 || 215 <= D && D <= 216 || 222 <= D && D <= 225 || D == 230 || 232 <= D && D <= 234 || 236 <= D && D <= 237 || D == 240 || 242 <= D && D <= 243 || 247 <= D && D <= 250 || D == 252 || D == 254 || D == 257 || D == 273 || D == 275 || D == 283 || 294 <= D && D <= 295 || D == 299 || 305 <= D && D <= 307 || D == 312 || 319 <= D && D <= 322 || D == 324 || 328 <= D && D <= 331 || D == 333 || 338 <= D && D <= 339 || 358 <= D && D <= 359 || D == 363 || D == 462 || D == 464 || D == 466 || D == 468 || D == 470 || D == 472 || D == 474 || D == 476 || D == 593 || D == 609 || D == 708 || D == 711 || 713 <= D && D <= 715 || D == 717 || D == 720 || 728 <= D && D <= 731 || D == 733 || D == 735 || 768 <= D && D <= 879 || 913 <= D && D <= 929 || 931 <= D && D <= 937 || 945 <= D && D <= 961 || 963 <= D && D <= 969 || D == 1025 || 1040 <= D && D <= 1103 || D == 1105 || D == 8208 || 8211 <= D && D <= 8214 || 8216 <= D && D <= 8217 || 8220 <= D && D <= 8221 || 8224 <= D && D <= 8226 || 8228 <= D && D <= 8231 || D == 8240 || 8242 <= D && D <= 8243 || D == 8245 || D == 8251 || D == 8254 || D == 8308 || D == 8319 || 8321 <= D && D <= 8324 || D == 8364 || D == 8451 || D == 8453 || D == 8457 || D == 8467 || D == 8470 || 8481 <= D && D <= 8482 || D == 8486 || D == 8491 || 8531 <= D && D <= 8532 || 8539 <= D && D <= 8542 || 8544 <= D && D <= 8555 || 8560 <= D && D <= 8569 || D == 8585 || 8592 <= D && D <= 8601 || 8632 <= D && D <= 8633 || D == 8658 || D == 8660 || D == 8679 || D == 8704 || 8706 <= D && D <= 8707 || 8711 <= D && D <= 8712 || D == 8715 || D == 8719 || D == 8721 || D == 8725 || D == 8730 || 8733 <= D && D <= 8736 || D == 8739 || D == 8741 || 8743 <= D && D <= 8748 || D == 8750 || 8756 <= D && D <= 8759 || 8764 <= D && D <= 8765 || D == 8776 || D == 8780 || D == 8786 || 8800 <= D && D <= 8801 || 8804 <= D && D <= 8807 || 8810 <= D && D <= 8811 || 8814 <= D && D <= 8815 || 8834 <= D && D <= 8835 || 8838 <= D && D <= 8839 || D == 8853 || D == 8857 || D == 8869 || D == 8895 || D == 8978 || 9312 <= D && D <= 9449 || 9451 <= D && D <= 9547 || 9552 <= D && D <= 9587 || 9600 <= D && D <= 9615 || 9618 <= D && D <= 9621 || 9632 <= D && D <= 9633 || 9635 <= D && D <= 9641 || 9650 <= D && D <= 9651 || 9654 <= D && D <= 9655 || 9660 <= D && D <= 9661 || 9664 <= D && D <= 9665 || 9670 <= D && D <= 9672 || D == 9675 || 9678 <= D && D <= 9681 || 9698 <= D && D <= 9701 || D == 9711 || 9733 <= D && D <= 9734 || D == 9737 || 9742 <= D && D <= 9743 || 9748 <= D && D <= 9749 || D == 9756 || D == 9758 || D == 9792 || D == 9794 || 9824 <= D && D <= 9825 || 9827 <= D && D <= 9829 || 9831 <= D && D <= 9834 || 9836 <= D && D <= 9837 || D == 9839 || 9886 <= D && D <= 9887 || 9918 <= D && D <= 9919 || 9924 <= D && D <= 9933 || 9935 <= D && D <= 9953 || D == 9955 || 9960 <= D && D <= 9983 || D == 10045 || D == 10071 || 10102 <= D && D <= 10111 || 11093 <= D && D <= 11097 || 12872 <= D && D <= 12879 || 57344 <= D && D <= 63743 || 65024 <= D && D <= 65039 || D == 65533 || 127232 <= D && D <= 127242 || 127248 <= D && D <= 127277 || 127280 <= D && D <= 127337 || 127344 <= D && D <= 127386 || 917760 <= D && D <= 917999 || 983040 <= D && D <= 1048573 || 1048576 <= D && D <= 1114109 ? "A" : "N";
  }, u2.characterLength = function(e2) {
    var s = this.eastAsianWidth(e2);
    return s == "F" || s == "W" || s == "A" ? 2 : 1;
  };
  function F(e2) {
    return e2.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[^\uD800-\uDFFF]/g) || [];
  }
  u2.length = function(e2) {
    for (var s = F(e2), i = 0, D = 0; D < s.length; D++) i = i + this.characterLength(s[D]);
    return i;
  }, u2.slice = function(e2, s, i) {
    textLen = u2.length(e2), s = s || 0, i = i || 1, s < 0 && (s = textLen + s), i < 0 && (i = textLen + i);
    for (var D = "", C = 0, o = F(e2), E2 = 0; E2 < o.length; E2++) {
      var a2 = o[E2], n = u2.length(a2);
      if (C >= s - (n == 2 ? 1 : 0)) if (C + n <= i) D += a2;
      else break;
      C += n;
    }
    return D;
  };
})(P);
var X = P.exports;
var DD = O(X);
var uD = function() {
  return /\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74|\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67)\uDB40\uDC7F|(?:\uD83E\uDDD1\uD83C\uDFFF\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFE])|(?:\uD83E\uDDD1\uD83C\uDFFE\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFD\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFC\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFB\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFB\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFC-\uDFFF])|\uD83D\uDC68(?:\uD83C\uDFFB(?:\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF]))|\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFC-\uDFFF])|[\u2695\u2696\u2708]\uFE0F|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))?|(?:\uD83C[\uDFFC-\uDFFF])\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF]))|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFE])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])\uFE0F|\u200D(?:(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D[\uDC66\uDC67])|\uD83D[\uDC66\uDC67])|\uD83C\uDFFF|\uD83C\uDFFE|\uD83C\uDFFD|\uD83C\uDFFC)?|(?:\uD83D\uDC69(?:\uD83C\uDFFB\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|(?:\uD83C[\uDFFC-\uDFFF])\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69]))|\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1)(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC69(?:\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83E\uDDD1(?:\u200D(?:\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83D\uDC69\u200D\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D[\uDC66\uDC67])|\uD83D\uDC69\u200D\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83E\uDDD1(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|\uD83D\uDC69(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|\uD83D\uDE36\u200D\uD83C\uDF2B|\uD83C\uDFF3\uFE0F\u200D\u26A7|\uD83D\uDC3B\u200D\u2744|(?:(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF])\u200D[\u2640\u2642]|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|\uD83C\uDFF4\u200D\u2620|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])\u200D[\u2640\u2642]|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u2600-\u2604\u260E\u2611\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26B0\u26B1\u26C8\u26CF\u26D1\u26D3\u26E9\u26F0\u26F1\u26F4\u26F7\u26F8\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u3030\u303D\u3297\u3299]|\uD83C[\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]|\uD83D[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3])\uFE0F|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|\uD83D\uDC69\u200D\uD83D\uDC67|\uD83D\uDC69\u200D\uD83D\uDC66|\uD83D\uDE35\u200D\uD83D\uDCAB|\uD83D\uDE2E\u200D\uD83D\uDCA8|\uD83D\uDC15\u200D\uD83E\uDDBA|\uD83E\uDDD1(?:\uD83C\uDFFF|\uD83C\uDFFE|\uD83C\uDFFD|\uD83C\uDFFC|\uD83C\uDFFB)?|\uD83D\uDC69(?:\uD83C\uDFFF|\uD83C\uDFFE|\uD83C\uDFFD|\uD83C\uDFFC|\uD83C\uDFFB)?|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF6\uD83C\uDDE6|\uD83C\uDDF4\uD83C\uDDF2|\uD83D\uDC08\u200D\u2B1B|\u2764\uFE0F\u200D(?:\uD83D\uDD25|\uD83E\uDE79)|\uD83D\uDC41\uFE0F|\uD83C\uDFF3\uFE0F|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|[#\*0-9]\uFE0F\u20E3|\u2764\uFE0F|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])|\uD83C\uDFF4|(?:[\u270A\u270B]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u270C\u270D]|\uD83D[\uDD74\uDD90])(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])|[\u270A\u270B]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC08\uDC15\uDC3B\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE2E\uDE35\uDE36\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5]|\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD]|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF]|[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED7\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0D\uDD0E\uDD10-\uDD17\uDD1D\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78\uDD7A-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCB\uDDD0\uDDE0-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6]|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDED5-\uDED7\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0C-\uDD3A\uDD3C-\uDD45\uDD47-\uDD78\uDD7A-\uDDCB\uDDCD-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26A7\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDED5-\uDED7\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0C-\uDD3A\uDD3C-\uDD45\uDD47-\uDD78\uDD7A-\uDDCB\uDDCD-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6])\uFE0F|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDC8F\uDC91\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1F\uDD26\uDD30-\uDD39\uDD3C-\uDD3E\uDD77\uDDB5\uDDB6\uDDB8\uDDB9\uDDBB\uDDCD-\uDDCF\uDDD1-\uDDDD])/g;
};
var FD = O(uD);
function A(t, u2 = {}) {
  if (typeof t != "string" || t.length === 0 || (u2 = { ambiguousIsNarrow: true, ...u2 }, t = T(t), t.length === 0)) return 0;
  t = t.replace(FD(), "  ");
  const F = u2.ambiguousIsNarrow ? 1 : 2;
  let e2 = 0;
  for (const s of t) {
    const i = s.codePointAt(0);
    if (i <= 31 || i >= 127 && i <= 159 || i >= 768 && i <= 879) continue;
    switch (DD.eastAsianWidth(s)) {
      case "F":
      case "W":
        e2 += 2;
        break;
      case "A":
        e2 += F;
        break;
      default:
        e2 += 1;
    }
  }
  return e2;
}
var m = 10;
var L = (t = 0) => (u2) => `\x1B[${u2 + t}m`;
var N = (t = 0) => (u2) => `\x1B[${38 + t};5;${u2}m`;
var I = (t = 0) => (u2, F, e2) => `\x1B[${38 + t};2;${u2};${F};${e2}m`;
var r = { modifier: { reset: [0, 0], bold: [1, 22], dim: [2, 22], italic: [3, 23], underline: [4, 24], overline: [53, 55], inverse: [7, 27], hidden: [8, 28], strikethrough: [9, 29] }, color: { black: [30, 39], red: [31, 39], green: [32, 39], yellow: [33, 39], blue: [34, 39], magenta: [35, 39], cyan: [36, 39], white: [37, 39], blackBright: [90, 39], gray: [90, 39], grey: [90, 39], redBright: [91, 39], greenBright: [92, 39], yellowBright: [93, 39], blueBright: [94, 39], magentaBright: [95, 39], cyanBright: [96, 39], whiteBright: [97, 39] }, bgColor: { bgBlack: [40, 49], bgRed: [41, 49], bgGreen: [42, 49], bgYellow: [43, 49], bgBlue: [44, 49], bgMagenta: [45, 49], bgCyan: [46, 49], bgWhite: [47, 49], bgBlackBright: [100, 49], bgGray: [100, 49], bgGrey: [100, 49], bgRedBright: [101, 49], bgGreenBright: [102, 49], bgYellowBright: [103, 49], bgBlueBright: [104, 49], bgMagentaBright: [105, 49], bgCyanBright: [106, 49], bgWhiteBright: [107, 49] } };
Object.keys(r.modifier);
var tD = Object.keys(r.color);
var eD = Object.keys(r.bgColor);
[...tD, ...eD];
function sD() {
  const t = /* @__PURE__ */ new Map();
  for (const [u2, F] of Object.entries(r)) {
    for (const [e2, s] of Object.entries(F)) r[e2] = { open: `\x1B[${s[0]}m`, close: `\x1B[${s[1]}m` }, F[e2] = r[e2], t.set(s[0], s[1]);
    Object.defineProperty(r, u2, { value: F, enumerable: false });
  }
  return Object.defineProperty(r, "codes", { value: t, enumerable: false }), r.color.close = "\x1B[39m", r.bgColor.close = "\x1B[49m", r.color.ansi = L(), r.color.ansi256 = N(), r.color.ansi16m = I(), r.bgColor.ansi = L(m), r.bgColor.ansi256 = N(m), r.bgColor.ansi16m = I(m), Object.defineProperties(r, { rgbToAnsi256: { value: (u2, F, e2) => u2 === F && F === e2 ? u2 < 8 ? 16 : u2 > 248 ? 231 : Math.round((u2 - 8) / 247 * 24) + 232 : 16 + 36 * Math.round(u2 / 255 * 5) + 6 * Math.round(F / 255 * 5) + Math.round(e2 / 255 * 5), enumerable: false }, hexToRgb: { value: (u2) => {
    const F = /[a-f\d]{6}|[a-f\d]{3}/i.exec(u2.toString(16));
    if (!F) return [0, 0, 0];
    let [e2] = F;
    e2.length === 3 && (e2 = [...e2].map((i) => i + i).join(""));
    const s = Number.parseInt(e2, 16);
    return [s >> 16 & 255, s >> 8 & 255, s & 255];
  }, enumerable: false }, hexToAnsi256: { value: (u2) => r.rgbToAnsi256(...r.hexToRgb(u2)), enumerable: false }, ansi256ToAnsi: { value: (u2) => {
    if (u2 < 8) return 30 + u2;
    if (u2 < 16) return 90 + (u2 - 8);
    let F, e2, s;
    if (u2 >= 232) F = ((u2 - 232) * 10 + 8) / 255, e2 = F, s = F;
    else {
      u2 -= 16;
      const C = u2 % 36;
      F = Math.floor(u2 / 36) / 5, e2 = Math.floor(C / 6) / 5, s = C % 6 / 5;
    }
    const i = Math.max(F, e2, s) * 2;
    if (i === 0) return 30;
    let D = 30 + (Math.round(s) << 2 | Math.round(e2) << 1 | Math.round(F));
    return i === 2 && (D += 60), D;
  }, enumerable: false }, rgbToAnsi: { value: (u2, F, e2) => r.ansi256ToAnsi(r.rgbToAnsi256(u2, F, e2)), enumerable: false }, hexToAnsi: { value: (u2) => r.ansi256ToAnsi(r.hexToAnsi256(u2)), enumerable: false } }), r;
}
var iD = sD();
var v = /* @__PURE__ */ new Set(["\x1B", "\x9B"]);
var CD = 39;
var w = "\x07";
var W = "[";
var rD = "]";
var R = "m";
var y = `${rD}8;;`;
var V = (t) => `${v.values().next().value}${W}${t}${R}`;
var z = (t) => `${v.values().next().value}${y}${t}${w}`;
var ED = (t) => t.split(" ").map((u2) => A(u2));
var _ = (t, u2, F) => {
  const e2 = [...u2];
  let s = false, i = false, D = A(T(t[t.length - 1]));
  for (const [C, o] of e2.entries()) {
    const E2 = A(o);
    if (D + E2 <= F ? t[t.length - 1] += o : (t.push(o), D = 0), v.has(o) && (s = true, i = e2.slice(C + 1).join("").startsWith(y)), s) {
      i ? o === w && (s = false, i = false) : o === R && (s = false);
      continue;
    }
    D += E2, D === F && C < e2.length - 1 && (t.push(""), D = 0);
  }
  !D && t[t.length - 1].length > 0 && t.length > 1 && (t[t.length - 2] += t.pop());
};
var nD = (t) => {
  const u2 = t.split(" ");
  let F = u2.length;
  for (; F > 0 && !(A(u2[F - 1]) > 0); ) F--;
  return F === u2.length ? t : u2.slice(0, F).join(" ") + u2.slice(F).join("");
};
var oD = (t, u2, F = {}) => {
  if (F.trim !== false && t.trim() === "") return "";
  let e2 = "", s, i;
  const D = ED(t);
  let C = [""];
  for (const [E2, a2] of t.split(" ").entries()) {
    F.trim !== false && (C[C.length - 1] = C[C.length - 1].trimStart());
    let n = A(C[C.length - 1]);
    if (E2 !== 0 && (n >= u2 && (F.wordWrap === false || F.trim === false) && (C.push(""), n = 0), (n > 0 || F.trim === false) && (C[C.length - 1] += " ", n++)), F.hard && D[E2] > u2) {
      const B2 = u2 - n, p2 = 1 + Math.floor((D[E2] - B2 - 1) / u2);
      Math.floor((D[E2] - 1) / u2) < p2 && C.push(""), _(C, a2, u2);
      continue;
    }
    if (n + D[E2] > u2 && n > 0 && D[E2] > 0) {
      if (F.wordWrap === false && n < u2) {
        _(C, a2, u2);
        continue;
      }
      C.push("");
    }
    if (n + D[E2] > u2 && F.wordWrap === false) {
      _(C, a2, u2);
      continue;
    }
    C[C.length - 1] += a2;
  }
  F.trim !== false && (C = C.map((E2) => nD(E2)));
  const o = [...C.join(`
`)];
  for (const [E2, a2] of o.entries()) {
    if (e2 += a2, v.has(a2)) {
      const { groups: B2 } = new RegExp(`(?:\\${W}(?<code>\\d+)m|\\${y}(?<uri>.*)${w})`).exec(o.slice(E2).join("")) || { groups: {} };
      if (B2.code !== void 0) {
        const p2 = Number.parseFloat(B2.code);
        s = p2 === CD ? void 0 : p2;
      } else B2.uri !== void 0 && (i = B2.uri.length === 0 ? void 0 : B2.uri);
    }
    const n = iD.codes.get(Number(s));
    o[E2 + 1] === `
` ? (i && (e2 += z("")), s && n && (e2 += V(n))) : a2 === `
` && (s && n && (e2 += V(s)), i && (e2 += z(i)));
  }
  return e2;
};
function G(t, u2, F) {
  return String(t).normalize().replace(/\r\n/g, `
`).split(`
`).map((e2) => oD(e2, u2, F)).join(`
`);
}
var aD = ["up", "down", "left", "right", "space", "enter", "cancel"];
var c = { actions: new Set(aD), aliases: /* @__PURE__ */ new Map([["k", "up"], ["j", "down"], ["h", "left"], ["l", "right"], ["", "cancel"], ["escape", "cancel"]]) };
function k(t, u2) {
  if (typeof t == "string") return c.aliases.get(t) === u2;
  for (const F of t) if (F !== void 0 && k(F, u2)) return true;
  return false;
}
function lD(t, u2) {
  if (t === u2) return;
  const F = t.split(`
`), e2 = u2.split(`
`), s = [];
  for (let i = 0; i < Math.max(F.length, e2.length); i++) F[i] !== e2[i] && s.push(i);
  return s;
}
var xD = globalThis.process.platform.startsWith("win");
var S = /* @__PURE__ */ Symbol("clack:cancel");
function BD(t) {
  return t === S;
}
function d(t, u2) {
  const F = t;
  F.isTTY && F.setRawMode(u2);
}
function cD({ input: t = $, output: u2 = j, overwrite: F = true, hideCursor: e2 = true } = {}) {
  const s = f.createInterface({ input: t, output: u2, prompt: "", tabSize: 1 });
  f.emitKeypressEvents(t, s), t.isTTY && t.setRawMode(true);
  const i = (D, { name: C, sequence: o }) => {
    const E2 = String(D);
    if (k([E2, C, o], "cancel")) {
      e2 && u2.write(import_sisteransi.cursor.show), process.exit(0);
      return;
    }
    if (!F) return;
    const a2 = C === "return" ? 0 : -1, n = C === "return" ? -1 : 0;
    f.moveCursor(u2, a2, n, () => {
      f.clearLine(u2, 1, () => {
        t.once("keypress", i);
      });
    });
  };
  return e2 && u2.write(import_sisteransi.cursor.hide), t.once("keypress", i), () => {
    t.off("keypress", i), e2 && u2.write(import_sisteransi.cursor.show), t.isTTY && !xD && t.setRawMode(false), s.terminal = false, s.close();
  };
}
var AD = Object.defineProperty;
var pD = (t, u2, F) => u2 in t ? AD(t, u2, { enumerable: true, configurable: true, writable: true, value: F }) : t[u2] = F;
var h = (t, u2, F) => (pD(t, typeof u2 != "symbol" ? u2 + "" : u2, F), F);
var x = class {
  constructor(u2, F = true) {
    h(this, "input"), h(this, "output"), h(this, "_abortSignal"), h(this, "rl"), h(this, "opts"), h(this, "_render"), h(this, "_track", false), h(this, "_prevFrame", ""), h(this, "_subscribers", /* @__PURE__ */ new Map()), h(this, "_cursor", 0), h(this, "state", "initial"), h(this, "error", ""), h(this, "value");
    const { input: e2 = $, output: s = j, render: i, signal: D, ...C } = u2;
    this.opts = C, this.onKeypress = this.onKeypress.bind(this), this.close = this.close.bind(this), this.render = this.render.bind(this), this._render = i.bind(this), this._track = F, this._abortSignal = D, this.input = e2, this.output = s;
  }
  unsubscribe() {
    this._subscribers.clear();
  }
  setSubscriber(u2, F) {
    const e2 = this._subscribers.get(u2) ?? [];
    e2.push(F), this._subscribers.set(u2, e2);
  }
  on(u2, F) {
    this.setSubscriber(u2, { cb: F });
  }
  once(u2, F) {
    this.setSubscriber(u2, { cb: F, once: true });
  }
  emit(u2, ...F) {
    const e2 = this._subscribers.get(u2) ?? [], s = [];
    for (const i of e2) i.cb(...F), i.once && s.push(() => e2.splice(e2.indexOf(i), 1));
    for (const i of s) i();
  }
  prompt() {
    return new Promise((u2, F) => {
      if (this._abortSignal) {
        if (this._abortSignal.aborted) return this.state = "cancel", this.close(), u2(S);
        this._abortSignal.addEventListener("abort", () => {
          this.state = "cancel", this.close();
        }, { once: true });
      }
      const e2 = new U(0);
      e2._write = (s, i, D) => {
        this._track && (this.value = this.rl?.line.replace(/\t/g, ""), this._cursor = this.rl?.cursor ?? 0, this.emit("value", this.value)), D();
      }, this.input.pipe(e2), this.rl = M.createInterface({ input: this.input, output: e2, tabSize: 2, prompt: "", escapeCodeTimeout: 50 }), M.emitKeypressEvents(this.input, this.rl), this.rl.prompt(), this.opts.initialValue !== void 0 && this._track && this.rl.write(this.opts.initialValue), this.input.on("keypress", this.onKeypress), d(this.input, true), this.output.on("resize", this.render), this.render(), this.once("submit", () => {
        this.output.write(import_sisteransi.cursor.show), this.output.off("resize", this.render), d(this.input, false), u2(this.value);
      }), this.once("cancel", () => {
        this.output.write(import_sisteransi.cursor.show), this.output.off("resize", this.render), d(this.input, false), u2(S);
      });
    });
  }
  onKeypress(u2, F) {
    if (this.state === "error" && (this.state = "active"), F?.name && (!this._track && c.aliases.has(F.name) && this.emit("cursor", c.aliases.get(F.name)), c.actions.has(F.name) && this.emit("cursor", F.name)), u2 && (u2.toLowerCase() === "y" || u2.toLowerCase() === "n") && this.emit("confirm", u2.toLowerCase() === "y"), u2 === "	" && this.opts.placeholder && (this.value || (this.rl?.write(this.opts.placeholder), this.emit("value", this.opts.placeholder))), u2 && this.emit("key", u2.toLowerCase()), F?.name === "return") {
      if (this.opts.validate) {
        const e2 = this.opts.validate(this.value);
        e2 && (this.error = e2 instanceof Error ? e2.message : e2, this.state = "error", this.rl?.write(this.value));
      }
      this.state !== "error" && (this.state = "submit");
    }
    k([u2, F?.name, F?.sequence], "cancel") && (this.state = "cancel"), (this.state === "submit" || this.state === "cancel") && this.emit("finalize"), this.render(), (this.state === "submit" || this.state === "cancel") && this.close();
  }
  close() {
    this.input.unpipe(), this.input.removeListener("keypress", this.onKeypress), this.output.write(`
`), d(this.input, false), this.rl?.close(), this.rl = void 0, this.emit(`${this.state}`, this.value), this.unsubscribe();
  }
  restoreCursor() {
    const u2 = G(this._prevFrame, process.stdout.columns, { hard: true }).split(`
`).length - 1;
    this.output.write(import_sisteransi.cursor.move(-999, u2 * -1));
  }
  render() {
    const u2 = G(this._render(this) ?? "", process.stdout.columns, { hard: true });
    if (u2 !== this._prevFrame) {
      if (this.state === "initial") this.output.write(import_sisteransi.cursor.hide);
      else {
        const F = lD(this._prevFrame, u2);
        if (this.restoreCursor(), F && F?.length === 1) {
          const e2 = F[0];
          this.output.write(import_sisteransi.cursor.move(0, e2)), this.output.write(import_sisteransi.erase.lines(1));
          const s = u2.split(`
`);
          this.output.write(s[e2]), this._prevFrame = u2, this.output.write(import_sisteransi.cursor.move(0, s.length - e2 - 1));
          return;
        }
        if (F && F?.length > 1) {
          const e2 = F[0];
          this.output.write(import_sisteransi.cursor.move(0, e2)), this.output.write(import_sisteransi.erase.down());
          const s = u2.split(`
`).slice(e2);
          this.output.write(s.join(`
`)), this._prevFrame = u2;
          return;
        }
        this.output.write(import_sisteransi.erase.down());
      }
      this.output.write(u2), this.state === "initial" && (this.state = "active"), this._prevFrame = u2;
    }
  }
};
var fD = class extends x {
  get cursor() {
    return this.value ? 0 : 1;
  }
  get _value() {
    return this.cursor === 0;
  }
  constructor(u2) {
    super(u2, false), this.value = !!u2.initialValue, this.on("value", () => {
      this.value = this._value;
    }), this.on("confirm", (F) => {
      this.output.write(import_sisteransi.cursor.move(0, -1)), this.value = F, this.state = "submit", this.close();
    }), this.on("cursor", () => {
      this.value = !this.value;
    });
  }
};
var bD = Object.defineProperty;
var mD = (t, u2, F) => u2 in t ? bD(t, u2, { enumerable: true, configurable: true, writable: true, value: F }) : t[u2] = F;
var Y = (t, u2, F) => (mD(t, typeof u2 != "symbol" ? u2 + "" : u2, F), F);
var wD = class extends x {
  constructor(u2) {
    super(u2, false), Y(this, "options"), Y(this, "cursor", 0), this.options = u2.options, this.value = [...u2.initialValues ?? []], this.cursor = Math.max(this.options.findIndex(({ value: F }) => F === u2.cursorAt), 0), this.on("key", (F) => {
      F === "a" && this.toggleAll();
    }), this.on("cursor", (F) => {
      switch (F) {
        case "left":
        case "up":
          this.cursor = this.cursor === 0 ? this.options.length - 1 : this.cursor - 1;
          break;
        case "down":
        case "right":
          this.cursor = this.cursor === this.options.length - 1 ? 0 : this.cursor + 1;
          break;
        case "space":
          this.toggleValue();
          break;
      }
    });
  }
  get _value() {
    return this.options[this.cursor].value;
  }
  toggleAll() {
    const u2 = this.value.length === this.options.length;
    this.value = u2 ? [] : this.options.map((F) => F.value);
  }
  toggleValue() {
    const u2 = this.value.includes(this._value);
    this.value = u2 ? this.value.filter((F) => F !== this._value) : [...this.value, this._value];
  }
};
var SD = Object.defineProperty;
var $D = (t, u2, F) => u2 in t ? SD(t, u2, { enumerable: true, configurable: true, writable: true, value: F }) : t[u2] = F;
var q = (t, u2, F) => ($D(t, typeof u2 != "symbol" ? u2 + "" : u2, F), F);
var jD = class extends x {
  constructor(u2) {
    super(u2, false), q(this, "options"), q(this, "cursor", 0), this.options = u2.options, this.cursor = this.options.findIndex(({ value: F }) => F === u2.initialValue), this.cursor === -1 && (this.cursor = 0), this.changeValue(), this.on("cursor", (F) => {
      switch (F) {
        case "left":
        case "up":
          this.cursor = this.cursor === 0 ? this.options.length - 1 : this.cursor - 1;
          break;
        case "down":
        case "right":
          this.cursor = this.cursor === this.options.length - 1 ? 0 : this.cursor + 1;
          break;
      }
      this.changeValue();
    });
  }
  get _value() {
    return this.options[this.cursor];
  }
  changeValue() {
    this.value = this._value.value;
  }
};

// node_modules/@clack/prompts/dist/index.mjs
var import_picocolors3 = __toESM(require_picocolors(), 1);
var import_sisteransi2 = __toESM(require_src(), 1);
import p from "process";
function X2() {
  return p.platform !== "win32" ? p.env.TERM !== "linux" : !!p.env.CI || !!p.env.WT_SESSION || !!p.env.TERMINUS_SUBLIME || p.env.ConEmuTask === "{cmd::Cmder}" || p.env.TERM_PROGRAM === "Terminus-Sublime" || p.env.TERM_PROGRAM === "vscode" || p.env.TERM === "xterm-256color" || p.env.TERM === "alacritty" || p.env.TERMINAL_EMULATOR === "JetBrains-JediTerm";
}
var E = X2();
var u = (s, n) => E ? s : n;
var ee = u("\u25C6", "*");
var A2 = u("\u25A0", "x");
var B = u("\u25B2", "x");
var S2 = u("\u25C7", "o");
var te = u("\u250C", "T");
var a = u("\u2502", "|");
var m2 = u("\u2514", "\u2014");
var j2 = u("\u25CF", ">");
var R2 = u("\u25CB", " ");
var V2 = u("\u25FB", "[\u2022]");
var M2 = u("\u25FC", "[+]");
var G2 = u("\u25FB", "[ ]");
var se = u("\u25AA", "\u2022");
var N2 = u("\u2500", "-");
var re = u("\u256E", "+");
var ie = u("\u251C", "+");
var ne = u("\u256F", "+");
var ae = u("\u25CF", "\u2022");
var oe = u("\u25C6", "*");
var ce = u("\u25B2", "!");
var le = u("\u25A0", "x");
var y2 = (s) => {
  switch (s) {
    case "initial":
    case "active":
      return import_picocolors3.default.cyan(ee);
    case "cancel":
      return import_picocolors3.default.red(A2);
    case "error":
      return import_picocolors3.default.yellow(B);
    case "submit":
      return import_picocolors3.default.green(S2);
  }
};
var k2 = (s) => {
  const { cursor: n, options: t, style: i } = s, r2 = s.maxItems ?? Number.POSITIVE_INFINITY, c2 = Math.max(process.stdout.rows - 4, 0), o = Math.min(c2, Math.max(r2, 5));
  let l2 = 0;
  n >= l2 + o - 3 ? l2 = Math.max(Math.min(n - o + 3, t.length - o), 0) : n < l2 + 2 && (l2 = Math.max(n - 2, 0));
  const $2 = o < t.length && l2 > 0, d2 = o < t.length && l2 + o < t.length;
  return t.slice(l2, l2 + o).map((w2, b2, C) => {
    const I2 = b2 === 0 && $2, x2 = b2 === C.length - 1 && d2;
    return I2 || x2 ? import_picocolors3.default.dim("...") : i(w2, b2 + l2 === n);
  });
};
var me = (s) => {
  const n = s.active ?? "Yes", t = s.inactive ?? "No";
  return new fD({ active: n, inactive: t, initialValue: s.initialValue ?? true, render() {
    const i = `${import_picocolors3.default.gray(a)}
${y2(this.state)}  ${s.message}
`, r2 = this.value ? n : t;
    switch (this.state) {
      case "submit":
        return `${i}${import_picocolors3.default.gray(a)}  ${import_picocolors3.default.dim(r2)}`;
      case "cancel":
        return `${i}${import_picocolors3.default.gray(a)}  ${import_picocolors3.default.strikethrough(import_picocolors3.default.dim(r2))}
${import_picocolors3.default.gray(a)}`;
      default:
        return `${i}${import_picocolors3.default.cyan(a)}  ${this.value ? `${import_picocolors3.default.green(j2)} ${n}` : `${import_picocolors3.default.dim(R2)} ${import_picocolors3.default.dim(n)}`} ${import_picocolors3.default.dim("/")} ${this.value ? `${import_picocolors3.default.dim(R2)} ${import_picocolors3.default.dim(t)}` : `${import_picocolors3.default.green(j2)} ${t}`}
${import_picocolors3.default.cyan(m2)}
`;
    }
  } }).prompt();
};
var de = (s) => {
  const n = (t, i) => {
    const r2 = t.label ?? String(t.value);
    switch (i) {
      case "selected":
        return `${import_picocolors3.default.dim(r2)}`;
      case "active":
        return `${import_picocolors3.default.green(j2)} ${r2} ${t.hint ? import_picocolors3.default.dim(`(${t.hint})`) : ""}`;
      case "cancelled":
        return `${import_picocolors3.default.strikethrough(import_picocolors3.default.dim(r2))}`;
      default:
        return `${import_picocolors3.default.dim(R2)} ${import_picocolors3.default.dim(r2)}`;
    }
  };
  return new jD({ options: s.options, initialValue: s.initialValue, render() {
    const t = `${import_picocolors3.default.gray(a)}
${y2(this.state)}  ${s.message}
`;
    switch (this.state) {
      case "submit":
        return `${t}${import_picocolors3.default.gray(a)}  ${n(this.options[this.cursor], "selected")}`;
      case "cancel":
        return `${t}${import_picocolors3.default.gray(a)}  ${n(this.options[this.cursor], "cancelled")}
${import_picocolors3.default.gray(a)}`;
      default:
        return `${t}${import_picocolors3.default.cyan(a)}  ${k2({ cursor: this.cursor, options: this.options, maxItems: s.maxItems, style: (i, r2) => n(i, r2 ? "active" : "inactive") }).join(`
${import_picocolors3.default.cyan(a)}  `)}
${import_picocolors3.default.cyan(m2)}
`;
    }
  } }).prompt();
};
var pe = (s) => {
  const n = (t, i) => {
    const r2 = t.label ?? String(t.value);
    return i === "active" ? `${import_picocolors3.default.cyan(V2)} ${r2} ${t.hint ? import_picocolors3.default.dim(`(${t.hint})`) : ""}` : i === "selected" ? `${import_picocolors3.default.green(M2)} ${import_picocolors3.default.dim(r2)}` : i === "cancelled" ? `${import_picocolors3.default.strikethrough(import_picocolors3.default.dim(r2))}` : i === "active-selected" ? `${import_picocolors3.default.green(M2)} ${r2} ${t.hint ? import_picocolors3.default.dim(`(${t.hint})`) : ""}` : i === "submitted" ? `${import_picocolors3.default.dim(r2)}` : `${import_picocolors3.default.dim(G2)} ${import_picocolors3.default.dim(r2)}`;
  };
  return new wD({ options: s.options, initialValues: s.initialValues, required: s.required ?? true, cursorAt: s.cursorAt, validate(t) {
    if (this.required && t.length === 0) return `Please select at least one option.
${import_picocolors3.default.reset(import_picocolors3.default.dim(`Press ${import_picocolors3.default.gray(import_picocolors3.default.bgWhite(import_picocolors3.default.inverse(" space ")))} to select, ${import_picocolors3.default.gray(import_picocolors3.default.bgWhite(import_picocolors3.default.inverse(" enter ")))} to submit`))}`;
  }, render() {
    const t = `${import_picocolors3.default.gray(a)}
${y2(this.state)}  ${s.message}
`, i = (r2, c2) => {
      const o = this.value.includes(r2.value);
      return c2 && o ? n(r2, "active-selected") : o ? n(r2, "selected") : n(r2, c2 ? "active" : "inactive");
    };
    switch (this.state) {
      case "submit":
        return `${t}${import_picocolors3.default.gray(a)}  ${this.options.filter(({ value: r2 }) => this.value.includes(r2)).map((r2) => n(r2, "submitted")).join(import_picocolors3.default.dim(", ")) || import_picocolors3.default.dim("none")}`;
      case "cancel": {
        const r2 = this.options.filter(({ value: c2 }) => this.value.includes(c2)).map((c2) => n(c2, "cancelled")).join(import_picocolors3.default.dim(", "));
        return `${t}${import_picocolors3.default.gray(a)}  ${r2.trim() ? `${r2}
${import_picocolors3.default.gray(a)}` : ""}`;
      }
      case "error": {
        const r2 = this.error.split(`
`).map((c2, o) => o === 0 ? `${import_picocolors3.default.yellow(m2)}  ${import_picocolors3.default.yellow(c2)}` : `   ${c2}`).join(`
`);
        return `${t + import_picocolors3.default.yellow(a)}  ${k2({ options: this.options, cursor: this.cursor, maxItems: s.maxItems, style: i }).join(`
${import_picocolors3.default.yellow(a)}  `)}
${r2}
`;
      }
      default:
        return `${t}${import_picocolors3.default.cyan(a)}  ${k2({ options: this.options, cursor: this.cursor, maxItems: s.maxItems, style: i }).join(`
${import_picocolors3.default.cyan(a)}  `)}
${import_picocolors3.default.cyan(m2)}
`;
    }
  } }).prompt();
};
var L2 = () => {
  const s = E ? ["\u25D2", "\u25D0", "\u25D3", "\u25D1"] : ["\u2022", "o", "O", "0"], n = E ? 80 : 120, t = process.env.CI === "true";
  let i, r2, c2 = false, o = "", l2;
  const $2 = (h2) => {
    const g = h2 > 1 ? "Something went wrong" : "Canceled";
    c2 && P2(g, h2);
  }, d2 = () => $2(2), w2 = () => $2(1), b2 = () => {
    process.on("uncaughtExceptionMonitor", d2), process.on("unhandledRejection", d2), process.on("SIGINT", w2), process.on("SIGTERM", w2), process.on("exit", $2);
  }, C = () => {
    process.removeListener("uncaughtExceptionMonitor", d2), process.removeListener("unhandledRejection", d2), process.removeListener("SIGINT", w2), process.removeListener("SIGTERM", w2), process.removeListener("exit", $2);
  }, I2 = () => {
    if (l2 === void 0) return;
    t && process.stdout.write(`
`);
    const h2 = l2.split(`
`);
    process.stdout.write(import_sisteransi2.cursor.move(-999, h2.length - 1)), process.stdout.write(import_sisteransi2.erase.down(h2.length));
  }, x2 = (h2) => h2.replace(/\.+$/, ""), O2 = (h2 = "") => {
    c2 = true, i = cD(), o = x2(h2), process.stdout.write(`${import_picocolors3.default.gray(a)}
`);
    let g = 0, f2 = 0;
    b2(), r2 = setInterval(() => {
      if (t && o === l2) return;
      I2(), l2 = o;
      const W2 = import_picocolors3.default.magenta(s[g]), _2 = t ? "..." : ".".repeat(Math.floor(f2)).slice(0, 3);
      process.stdout.write(`${W2}  ${o}${_2}`), g = g + 1 < s.length ? g + 1 : 0, f2 = f2 < s.length ? f2 + 0.125 : 0;
    }, n);
  }, P2 = (h2 = "", g = 0) => {
    c2 = false, clearInterval(r2), I2();
    const f2 = g === 0 ? import_picocolors3.default.green(S2) : g === 1 ? import_picocolors3.default.red(A2) : import_picocolors3.default.red(B);
    o = x2(h2 ?? o), process.stdout.write(`${f2}  ${o}
`), C(), i();
  };
  return { start: O2, stop: P2, message: (h2 = "") => {
    o = x2(h2 ?? o);
  } };
};

// src/skills-bridge/search-api.ts
var SKILLS_API_BASE = process.env.SKILLS_API_URL || "https://skills.sh";
async function searchSkillsAPI(query, limit = 10) {
  try {
    const url = `${SKILLS_API_BASE}/api/search?q=${encodeURIComponent(query)}&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.skills.map((skill) => ({
      name: skill.name,
      slug: skill.id,
      source: skill.source || "",
      installs: skill.installs
    }));
  } catch {
    return [];
  }
}

// src/skills-bridge/discover.ts
var DEFAULT_SOURCE = "obra/superpowers";
async function fetchDefaultSkills() {
  const results = await searchSkillsAPI("obra/superpowers", 50);
  return results.filter((r2) => r2.source === DEFAULT_SOURCE).map((r2) => ({
    name: r2.name,
    description: "",
    installName: r2.source,
    sourceUrl: `https://skills.sh/${r2.slug}`,
    relevance: 0,
    matchedTags: [],
    installs: r2.installs,
    isDefault: true
  }));
}
async function discoverSkillsForTags(tags) {
  if (tags.length === 0) return [];
  const skillMap = /* @__PURE__ */ new Map();
  for (const tag of tags) {
    const results = await searchSkillsAPI(tag);
    for (const result of results) {
      const key = result.name;
      const existing = skillMap.get(key);
      if (existing) {
        if (!existing.matchedTags.includes(tag)) {
          existing.relevance += 1;
          existing.matchedTags.push(tag);
        }
        if (result.installs > existing.installs) {
          existing.installName = result.source;
          existing.sourceUrl = `https://skills.sh/${result.slug}`;
          existing.installs = result.installs;
        }
      } else {
        skillMap.set(key, {
          name: result.name,
          description: "",
          installName: result.source,
          sourceUrl: `https://skills.sh/${result.slug}`,
          relevance: 1,
          matchedTags: [tag],
          installs: result.installs,
          isDefault: false
        });
      }
    }
  }
  return Array.from(skillMap.values()).sort((a2, b2) => {
    if (b2.relevance !== a2.relevance) return b2.relevance - a2.relevance;
    if (b2.installs !== a2.installs) return b2.installs - a2.installs;
    return a2.name.localeCompare(b2.name);
  });
}
async function discoverSkills(tags) {
  const [defaults, tagResults] = await Promise.all([
    fetchDefaultSkills(),
    discoverSkillsForTags(tags)
  ]);
  const merged = /* @__PURE__ */ new Map();
  for (const skill of defaults) {
    merged.set(skill.name, skill);
  }
  for (const skill of tagResults) {
    const existing = merged.get(skill.name);
    if (existing) {
      existing.relevance += skill.relevance;
      for (const tag of skill.matchedTags) {
        if (!existing.matchedTags.includes(tag)) {
          existing.matchedTags.push(tag);
        }
      }
      if (skill.installs > existing.installs) {
        existing.installs = skill.installs;
      }
    } else {
      merged.set(skill.name, skill);
    }
  }
  return Array.from(merged.values()).sort((a2, b2) => {
    if (a2.isDefault !== b2.isDefault) return a2.isDefault ? -1 : 1;
    if (b2.relevance !== a2.relevance) return b2.relevance - a2.relevance;
    if (b2.installs !== a2.installs) return b2.installs - a2.installs;
    return a2.name.localeCompare(b2.name);
  });
}

// src/skills-bridge/install.ts
import { execFile } from "child_process";
import { promisify } from "util";
var execFileAsync = promisify(execFile);
async function installDiscoveredSkill(skill, scope, cwd) {
  const isGlobal = scope === "user";
  const args = [
    "skills",
    "add",
    skill.installName,
    "--skill",
    skill.name,
    "-a",
    "claude-code",
    "-y"
  ];
  if (isGlobal) args.push("-g");
  try {
    await execFileAsync("npx", args, { cwd, timeout: 6e4 });
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
async function installDiscoveredSkills(skills, scope, cwd) {
  const results = [];
  let successCount = 0;
  let failedCount = 0;
  for (const skill of skills) {
    const result = await installDiscoveredSkill(skill, scope, cwd);
    results.push({ name: skill.name, result });
    if (result.success) {
      successCount += 1;
    } else {
      failedCount += 1;
    }
  }
  return {
    total: skills.length,
    success: successCount,
    failed: failedCount,
    results
  };
}

// src/install/claude-md.ts
import { readFile as readFile2, writeFile, mkdir } from "fs/promises";
import { dirname } from "path";

// src/install/scope.ts
import { homedir } from "os";
function resolveClaudeMdPath(scope) {
  switch (scope) {
    case "user":
      return `${homedir()}/.claude/CLAUDE.md`;
    case "project":
      return "CLAUDE.md";
    case "local":
      return "CLAUDE.local.md";
  }
}

// src/install/claude-md.ts
var MARKER_START = "<!-- superpower-skills-start -->";
var MARKER_END = "<!-- superpower-skills-end -->";
function generateClaudeMdSection(skills) {
  if (skills.length === 0) return "";
  const lines = [
    MARKER_START,
    "# Superpowers Skills",
    "",
    "ALWAYS check if a superpowers skill applies before starting any task.",
    ""
  ];
  for (const skill of skills) {
    lines.push(`- Use ${skill.name} \u2014 ${skill.description}`);
  }
  lines.push(MARKER_END);
  return lines.join("\n");
}
async function updateClaudeMd(skills, scope) {
  if (skills.length === 0) return;
  const section = generateClaudeMdSection(skills);
  if (!section) return;
  const filePath = resolveClaudeMdPath(scope);
  try {
    await mkdir(dirname(filePath), { recursive: true });
    let existing = "";
    try {
      existing = await readFile2(filePath, "utf-8");
    } catch {
    }
    let updated;
    const startIdx = existing.indexOf(MARKER_START);
    const endIdx = existing.indexOf(MARKER_END);
    if (startIdx !== -1 && endIdx !== -1) {
      updated = existing.slice(0, startIdx) + section + existing.slice(endIdx + MARKER_END.length);
    } else if (existing.length > 0) {
      updated = existing.trimEnd() + "\n\n" + section + "\n";
    } else {
      updated = section + "\n";
    }
    await writeFile(filePath, updated);
    console.log(
      `  ${theme.success("+")} Updated ${theme.bold(filePath)} with skill rules`
    );
  } catch {
    console.log(
      `  ${theme.warn("!")} Could not update ${filePath} ${theme.dim("(write failed)")}`
    );
  }
}

// src/prompts/search-checkbox.ts
var import_picocolors4 = __toESM(require_picocolors(), 1);
async function searchCheckboxMenu(title, items, initialFilter = "") {
  const selected = /* @__PURE__ */ new Set();
  let filter = initialFilter;
  let cursorIdx = 0;
  let scrollOffset = 0;
  const getTermHeight = () => {
    return process.stdout.rows || 24;
  };
  const getVisible = () => {
    const lc = filter.toLowerCase();
    const indices = [];
    for (let i = 0; i < items.length; i++) {
      if (!filter || items[i].name.toLowerCase().includes(lc) || items[i].description.toLowerCase().includes(lc)) {
        indices.push(i);
      }
    }
    return indices;
  };
  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();
    process.stdout.write("\x1B[?25l");
    let lastLines = 0;
    const render = () => {
      const maxVisible = getTermHeight() - 7;
      const visible = getVisible();
      const visCount = visible.length;
      const displayCount = Math.min(visCount, Math.max(maxVisible, 5));
      if (cursorIdx >= visCount) cursorIdx = Math.max(0, visCount - 1);
      if (cursorIdx < 0) cursorIdx = 0;
      if (visCount > displayCount) {
        if (cursorIdx < scrollOffset) scrollOffset = cursorIdx;
        if (cursorIdx >= scrollOffset + displayCount)
          scrollOffset = cursorIdx - displayCount + 1;
      } else {
        scrollOffset = 0;
      }
      const lines = [];
      lines.push(`${import_picocolors4.default.bold(import_picocolors4.default.cyan(`  ${title}`))}`);
      lines.push(
        import_picocolors4.default.dim(
          "  Type to filter, space to toggle, enter to confirm, esc to cancel"
        )
      );
      lines.push("");
      lines.push(`  ${import_picocolors4.default.bold("Filter:")} ${filter}${import_picocolors4.default.inverse(" ")}`);
      lines.push("");
      if (visCount === 0) {
        lines.push(`  ${import_picocolors4.default.dim(`No items match "${filter}"`)}`);
        lines.push("");
      } else {
        const maxNameLen = Math.max(...visible.map((i) => items[i].name.length));
        const end = Math.min(scrollOffset + displayCount, visCount);
        for (let vi = scrollOffset; vi < end; vi++) {
          const idx = visible[vi];
          const item = items[idx];
          const isSelected = selected.has(item.name);
          const checkbox = isSelected ? import_picocolors4.default.green("[x]") : "[ ]";
          let desc = item.description;
          if (desc.length > 50) desc = desc.slice(0, 50) + "...";
          const paddedName = item.name.padEnd(maxNameLen + 2);
          if (vi === cursorIdx) {
            lines.push(
              `  ${import_picocolors4.default.bold(">")} ${checkbox} ${import_picocolors4.default.bold(paddedName)}${import_picocolors4.default.dim(`\u2014 ${desc}`)}`
            );
          } else {
            lines.push(`    ${checkbox} ${paddedName}${import_picocolors4.default.dim(`\u2014 ${desc}`)}`);
          }
        }
      }
      lines.push("");
      lines.push(
        `  ${import_picocolors4.default.dim(`${visCount} matching \xB7 ${selected.size} selected`)}`
      );
      let output = "";
      if (lastLines > 0) {
        output += `\x1B[${lastLines}A`;
        for (let i = 0; i < lastLines; i++) {
          output += "\x1B[2K";
          if (i < lastLines - 1) output += "\x1B[1B";
        }
        output += `\x1B[${lastLines - 1}A`;
      }
      output += lines.map((l2) => `\x1B[2K${l2}`).join("\n") + "\n";
      lastLines = lines.length;
      process.stdout.write(output);
    };
    const cleanup = () => {
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      process.stdout.write("\x1B[?25h");
      process.stdin.removeAllListeners("data");
      process.stdin.pause();
    };
    render();
    process.stdin.on("data", (data) => {
      const key = data.toString();
      const visible = getVisible();
      if (key === "\x1B" || key === "\x1B\x1B") {
        cleanup();
        resolve(null);
        return;
      }
      if (key === "\x1B[A") {
        if (cursorIdx > 0) cursorIdx--;
        render();
        return;
      }
      if (key === "\x1B[B") {
        if (cursorIdx < visible.length - 1) cursorIdx++;
        render();
        return;
      }
      if (key === " ") {
        if (visible.length > 0 && cursorIdx < visible.length) {
          const idx = visible[cursorIdx];
          const name = items[idx].name;
          if (selected.has(name)) {
            selected.delete(name);
          } else {
            selected.add(name);
          }
        }
        render();
        return;
      }
      if (key === "\r" || key === "\n") {
        cleanup();
        resolve([...selected]);
        return;
      }
      if (key === "\x7F" || key === "\b") {
        if (filter.length > 0) {
          filter = filter.slice(0, -1);
          cursorIdx = 0;
          scrollOffset = 0;
        }
        render();
        return;
      }
      if (key.length === 1 && key >= " " && key <= "~") {
        filter += key;
        cursorIdx = 0;
        scrollOffset = 0;
        render();
        return;
      }
    });
  });
}

// src/prompts/select.ts
var import_picocolors5 = __toESM(require_picocolors(), 1);
async function selectMenu(title, options, opts) {
  const maxLabelLen = Math.max(...options.map((o) => o.label.length));
  const items = options.map((o) => ({
    label: o.description ? `${o.label.padEnd(maxLabelLen + 2)}${import_picocolors5.default.dim(`\u2014 ${o.description}`)}` : o.label,
    value: o.value
  }));
  if (opts?.showBack) {
    items.push({
      label: import_picocolors5.default.dim("\u2190 Back"),
      value: "__back__"
    });
  }
  const result = await de({
    message: title,
    options: items
  });
  if (BD(result) || result === "__back__") {
    return null;
  }
  return result;
}

// src/commands/search.ts
async function cmdSearch(initialFilter, scope, scopeSetByFlag2) {
  printBanner();
  const tags = initialFilter ? [initialFilter] : ["general"];
  const s = L2();
  s.start("Searching skills ecosystem...");
  let discovered;
  try {
    discovered = await discoverSkillsForTags(tags);
  } catch {
    s.stop("Search failed");
    console.log(theme.warn("Could not reach skills.sh."));
    return;
  }
  s.stop(`Found ${discovered.length} skills`);
  if (discovered.length === 0) {
    console.log(theme.warn("No skills found matching your search."));
    process.exit(0);
  }
  const items = discovered.map((sk) => ({
    name: sk.name,
    description: `${sk.installName}${sk.description ? " \u2014 " + sk.description : ""}`
  }));
  console.log("");
  const selected = await searchCheckboxMenu(
    `Select skills (${discovered.length} found)`,
    items,
    initialFilter
  );
  if (!selected || selected.length === 0) {
    if (selected === null) {
      console.log("");
      console.log(theme.warn("Search cancelled."));
    } else {
      console.log(theme.warn("No skills selected. Exiting."));
    }
    process.exit(0);
  }
  if (!scopeSetByFlag2) {
    const scopeResult = await selectScopeMenu();
    if (scopeResult) scope = scopeResult;
  }
  const selectedSkills = discovered.filter((s2) => selected.includes(s2.name));
  console.log("");
  console.log(theme.bold(`Skills to install (${selectedSkills.length}):`));
  console.log(theme.dim(`  Scope: ${scope}`));
  console.log("");
  for (const skill of selectedSkills) {
    console.log(`  ${theme.success("+")} ${theme.bold(skill.name)}  ${theme.dim(skill.installName)}`);
  }
  console.log("");
  const confirm = await me({ message: "Install these skills?" });
  if (BD(confirm) || !confirm) {
    console.log(theme.warn("Installation cancelled."));
    process.exit(0);
  }
  const cwd = process.cwd();
  const result = await installDiscoveredSkills(selectedSkills, scope, cwd);
  if (result.success > 0) {
    const installed = await getInstalledSkillMetadata(cwd);
    await updateClaudeMd(installed, scope);
  }
}
async function selectScopeMenu() {
  const result = await selectMenu("Where should these be installed?", [
    { label: "Project scope", description: ".claude/ \u2014 shared with all collaborators via git", value: "project" },
    { label: "User scope", description: "~/.claude/ \u2014 available in all your projects", value: "user" },
    { label: "Local scope", description: ".claude/ + .gitignore \u2014 this repo only, not committed", value: "local" }
  ]);
  return result;
}

// src/commands/update.ts
import { execFile as execFile2 } from "child_process";
import { promisify as promisify2 } from "util";
var execFileAsync2 = promisify2(execFile2);
async function cmdUpdate() {
  const cwd = process.cwd();
  const skills = await getInstalledSkillMetadata(cwd);
  if (skills.length === 0) {
    console.log(theme.warn("No skills installed. Nothing to update."));
    return;
  }
  console.log(theme.bold(`Updating ${skills.length} installed skills...`));
  console.log("");
  const s = L2();
  s.start("Updating skills...");
  try {
    await execFileAsync2("npx", ["skills", "update"], { cwd, timeout: 12e4 });
    s.stop("Skills updated");
  } catch {
    s.stop("Update completed with warnings");
    console.log(theme.dim("Some skills may not have been updated. Run 'npx skills check' for details."));
  }
}

// src/commands/scan.ts
import { execFile as execFile3 } from "child_process";
import { promisify as promisify3 } from "util";

// src/detect/patterns.ts
import { readFile as readFile3, readdir as readdir2 } from "fs/promises";
import { existsSync } from "fs";
function uniquePush(arr, ...items) {
  for (const item of items) {
    if (!arr.includes(item)) arr.push(item);
  }
}
function fileExists(path) {
  return existsSync(path);
}
async function hasGlob(pattern) {
  try {
    const entries = await readdir2(".");
    return entries.some((e2) => e2.match(new RegExp(pattern)));
  } catch {
    return false;
  }
}
async function readFileSafe(path) {
  try {
    return await readFile3(path, "utf-8");
  } catch {
    return "";
  }
}
async function detectProject() {
  const result = {
    techs: [],
    skillTags: []
  };
  const t = result.techs;
  const st = result.skillTags;
  if (fileExists("package.json")) {
    uniquePush(t, "Node.js");
    const pkg = await readFileSafe("package.json");
    if (pkg.includes('"react-native"')) {
      uniquePush(t, "React Native");
      uniquePush(st, "react-native", "mobile", "typescript");
    } else if (pkg.includes('"react"')) {
      uniquePush(t, "React");
      uniquePush(st, "react", "web", "typescript");
    }
    if (pkg.includes('"vue"')) {
      uniquePush(t, "Vue");
      uniquePush(st, "vue", "web", "typescript");
    }
    if (pkg.includes('"@angular/core"')) {
      uniquePush(t, "Angular");
      uniquePush(st, "angular", "web", "typescript");
    }
    if (pkg.includes('"next"')) {
      uniquePush(t, "Next.js");
      uniquePush(st, "nextjs", "react", "web", "typescript");
    }
    if (pkg.includes('"nuxt"')) {
      uniquePush(t, "Nuxt");
      uniquePush(st, "vue", "web", "typescript");
    }
    if (pkg.includes('"express"')) {
      uniquePush(t, "Express");
      uniquePush(st, "nodejs", "backend", "typescript");
    }
    if (pkg.includes('"@nestjs/core"')) {
      uniquePush(t, "NestJS");
      uniquePush(st, "nodejs", "backend", "typescript");
    }
    if (pkg.includes('"fastify"')) {
      uniquePush(t, "Fastify");
      uniquePush(st, "nodejs", "backend", "typescript");
    }
    if (pkg.includes('"expo"')) {
      uniquePush(t, "Expo");
      uniquePush(st, "expo", "mobile", "react-native", "typescript");
    }
    if (/\"(jest|vitest|mocha|cypress|playwright)\"/.test(pkg)) {
      uniquePush(t, "Testing");
      uniquePush(st, "universal");
    }
    if (pkg.includes('"langchain"') || pkg.includes('"@langchain/')) {
      uniquePush(t, "LangChain");
      uniquePush(st, "ai");
    }
    if (pkg.includes('"ethers"') || pkg.includes('"web3"') || pkg.includes('"hardhat"')) {
      uniquePush(t, "Web3");
      uniquePush(st, "web3");
    }
    if (pkg.includes('"stripe"') || pkg.includes('"@stripe/')) {
      uniquePush(t, "Stripe");
    }
    if (/\"(?:prisma|drizzle-orm|@drizzle-team|typeorm|sequelize|mongoose|knex|@mikro-orm|better-sqlite3|pg|mysql2|ioredis|redis)\"/.test(pkg)) {
      uniquePush(t, "Database/ORM");
    }
    if (/\"(?:passport|@auth0|next-auth|@clerk|firebase|jsonwebtoken|bcrypt|helmet|@supabase\/auth-helpers)\"/.test(pkg)) {
      uniquePush(t, "Auth/Security");
    }
    if (/\"(?:@sentry\/node|@sentry\/react|@datadog|@opentelemetry|newrelic|pino|winston)\"/.test(pkg)) {
      uniquePush(t, "Monitoring");
    }
    if (/\"(?:mixpanel|@amplitude|@segment\/analytics-node|posthog-node|chart\.js|d3|recharts)\"/.test(pkg)) {
      uniquePush(t, "Analytics");
    }
    if (/\"(?:tailwindcss|@chakra-ui|@mui\/material|@radix-ui|styled-components|@emotion|storybook|@storybook)\"/.test(pkg)) {
      uniquePush(t, "Design System");
    }
    if (/\"(?:contentful|@sanity|strapi|@keystonejs|ghost|@contentlayer)\"/.test(pkg)) {
      uniquePush(t, "CMS");
    }
  }
  if (fileExists("tsconfig.json")) {
    uniquePush(t, "TypeScript");
    uniquePush(st, "typescript");
  }
  if (fileExists("requirements.txt") || fileExists("pyproject.toml") || fileExists("setup.py") || fileExists("Pipfile")) {
    uniquePush(t, "Python");
    uniquePush(st, "python", "backend");
    let pydeps = "";
    for (const f2 of ["requirements.txt", "pyproject.toml", "Pipfile"]) {
      pydeps += await readFileSafe(f2);
    }
    if (/django/i.test(pydeps)) {
      uniquePush(t, "Django");
      uniquePush(st, "python", "backend");
    }
    if (/fastapi/i.test(pydeps)) {
      uniquePush(t, "FastAPI");
      uniquePush(st, "python", "backend");
    }
    if (/flask/i.test(pydeps)) {
      uniquePush(t, "Flask");
      uniquePush(st, "python", "backend");
    }
    if (/(?:tensorflow|torch|langchain|openai|anthropic|transformers)/i.test(pydeps)) {
      uniquePush(t, "AI/ML");
      uniquePush(st, "ai");
    }
    if (/(?:pyspark|dbt|airflow|pandas|polars)/i.test(pydeps)) {
      uniquePush(t, "Data Engineering");
    }
    if (/(?:sqlalchemy|peewee|tortoise-orm|psycopg2|pymongo|redis)/i.test(pydeps)) {
      uniquePush(t, "Database/ORM");
    }
    if (/(?:authlib|python-jose|passlib|django-allauth)/i.test(pydeps)) {
      uniquePush(t, "Auth/Security");
    }
    if (/(?:sentry-sdk|datadog|opentelemetry-api)/i.test(pydeps)) {
      uniquePush(t, "Monitoring");
    }
    if (/(?:matplotlib|plotly|dash|streamlit|metabase)/i.test(pydeps)) {
      uniquePush(t, "Analytics");
    }
  }
  if (fileExists("go.mod")) {
    uniquePush(t, "Go");
    uniquePush(st, "go", "backend");
    const gomod = await readFileSafe("go.mod");
    if (/(?:gorm\.io|entgo\.io|github\.com\/jmoiron\/sqlx)/i.test(gomod)) {
      uniquePush(t, "Database/ORM");
    }
  }
  if (fileExists("Cargo.toml")) {
    uniquePush(t, "Rust");
    uniquePush(st, "rust");
    const cargo = await readFileSafe("Cargo.toml");
    if (/(?:diesel|sqlx|sea-orm)/i.test(cargo)) {
      uniquePush(t, "Database/ORM");
    }
  }
  if (fileExists("Gemfile")) {
    uniquePush(t, "Ruby");
    uniquePush(st, "ruby", "backend");
    const gemfile = await readFileSafe("Gemfile");
    if (/rails/i.test(gemfile)) {
      uniquePush(t, "Rails");
      uniquePush(st, "ruby", "backend");
    }
  }
  if (fileExists("pom.xml") || fileExists("build.gradle") || fileExists("build.gradle.kts")) {
    uniquePush(t, "Java/Kotlin");
    uniquePush(st, "java", "kotlin");
  }
  if (fileExists("Podfile") || await hasGlob("\\.xcodeproj$")) {
    uniquePush(t, "iOS");
    uniquePush(st, "ios", "swift", "mobile");
  }
  if (fileExists("pubspec.yaml")) {
    uniquePush(t, "Flutter");
    uniquePush(st, "flutter", "mobile");
  }
  if (await hasGlob("\\.csproj$")) {
    uniquePush(t, "C#/.NET");
    uniquePush(st, "csharp");
  }
  if (fileExists("composer.json")) {
    uniquePush(t, "PHP");
    uniquePush(st, "php", "backend");
    const composer = await readFileSafe("composer.json");
    if (/laravel/i.test(composer)) {
      uniquePush(t, "Laravel");
      uniquePush(st, "php", "backend");
    }
  }
  if (fileExists("Dockerfile") || fileExists("docker-compose.yml") || fileExists("docker-compose.yaml") || fileExists("compose.yml") || fileExists("compose.yaml")) {
    uniquePush(t, "Docker");
    uniquePush(st, "devops");
  }
  if (fileExists("k8s") || fileExists("kubernetes")) {
    uniquePush(t, "Kubernetes");
    uniquePush(st, "devops");
  }
  if (await hasGlob("\\.tf$") || fileExists("terraform")) {
    uniquePush(t, "Terraform");
    uniquePush(st, "devops");
  }
  if (fileExists(".github/workflows") || fileExists(".gitlab-ci.yml") || fileExists("Jenkinsfile")) {
    uniquePush(t, "CI/CD");
    uniquePush(st, "devops");
  }
  const lintFiles = [
    ".eslintrc",
    ".eslintrc.js",
    ".eslintrc.json",
    ".eslintrc.yml",
    "eslint.config.js",
    "eslint.config.mjs",
    ".prettierrc",
    ".prettierrc.json",
    "prettier.config.js",
    "prettier.config.mjs",
    "biome.json"
  ];
  if (lintFiles.some(fileExists)) {
    uniquePush(t, "Linting");
    uniquePush(st, "universal");
  }
  if (fileExists("hardhat.config.ts") || fileExists("hardhat.config.js") || fileExists("foundry.toml")) {
    uniquePush(t, "Blockchain");
    uniquePush(st, "web3");
  }
  if (fileExists("prometheus.yml") || fileExists("grafana")) {
    uniquePush(t, "Monitoring");
  }
  const archetypes = deriveArchetypes(result);
  if (archetypes.length > 0) {
    result.archetypes = archetypes;
  }
  return result;
}
function deriveArchetypes(result) {
  const archetypes = [];
  const hasFrontend = result.skillTags.some(
    (t) => ["react", "vue", "angular", "nextjs"].includes(t)
  );
  const hasBackend = result.skillTags.includes("backend");
  const hasDocker = result.techs.includes("Docker");
  const hasK8sOrTerraform = result.techs.some(
    (t) => ["Kubernetes", "Terraform"].includes(t)
  );
  const hasCICD = result.techs.includes("CI/CD");
  const hasAI = result.techs.some(
    (t) => ["AI/ML", "LangChain"].includes(t)
  ) || result.skillTags.includes("ai");
  const hasData = result.techs.some(
    (t) => ["Data Engineering", "Database/ORM"].includes(t)
  );
  const hasPayments = result.techs.includes("Stripe");
  const hasMobile = result.skillTags.some(
    (t) => ["mobile", "react-native", "flutter", "ios", "android"].includes(t)
  );
  if (hasFrontend && hasBackend) archetypes.push("fullstack-web");
  if (!hasFrontend && hasBackend) archetypes.push("api-backend");
  if (hasMobile) archetypes.push("mobile-app");
  if (hasDocker && (hasK8sOrTerraform || hasCICD)) archetypes.push("devops-infra");
  if (hasAI && hasData) archetypes.push("ml-platform");
  if (hasAI && !hasData) archetypes.push("data-pipeline");
  if (hasPayments && hasFrontend) archetypes.push("e-commerce");
  return archetypes;
}

// src/detect/ai.ts
import { readFile as readFile4, readdir as readdir3, stat } from "fs/promises";
import { existsSync as existsSync2 } from "fs";
import { join as join2 } from "path";
import { spawn } from "child_process";
function spawnWithStdin(cmd, args, input, opts) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      env: opts.env,
      stdio: ["pipe", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    let killed = false;
    child.stdout.on("data", (d2) => {
      stdout += d2;
    });
    child.stderr.on("data", (d2) => {
      stderr += d2;
    });
    const timer = opts.timeout ? setTimeout(() => {
      killed = true;
      child.kill();
    }, opts.timeout) : void 0;
    child.on("close", (code) => {
      if (timer) clearTimeout(timer);
      if (killed) {
        reject(Object.assign(new Error("Process timed out"), { killed: true }));
      } else if (code !== 0) {
        reject(new Error(`Process exited with code ${code}: ${stderr}`));
      } else {
        resolve({ stdout, killed: false });
      }
    });
    child.on("error", (err) => {
      if (timer) clearTimeout(timer);
      reject(err);
    });
    child.stdin.write(input);
    child.stdin.end();
  });
}
var VALID_SKILL_TAGS = /* @__PURE__ */ new Set([
  "universal",
  "web",
  "react",
  "nextjs",
  "vue",
  "angular",
  "mobile",
  "react-native",
  "expo",
  "flutter",
  "ios",
  "swift",
  "android",
  "kotlin",
  "backend",
  "nodejs",
  "python",
  "php",
  "ruby",
  "java",
  "cpp",
  "csharp",
  "go",
  "rust",
  "typescript",
  "devops",
  "creative",
  "documents",
  "web3",
  "ai"
]);
var VALID_ARCHETYPES = /* @__PURE__ */ new Set([
  "fullstack-web",
  "api-backend",
  "mobile-app",
  "data-pipeline",
  "ml-platform",
  "devops-infra",
  "cli-tool",
  "e-commerce",
  "saas",
  "monorepo",
  "library",
  "microservices"
]);
async function readFileSafe2(path, maxLines) {
  try {
    const content = await readFile4(path, "utf-8");
    return content.split("\n").slice(0, maxLines).join("\n");
  } catch {
    return "";
  }
}
var SKIP_DIRS = /* @__PURE__ */ new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "__pycache__",
  ".venv",
  "vendor",
  "target",
  ".cache",
  "coverage",
  ".turbo"
]);
async function buildDirTree(dir, depth, maxEntries) {
  const lines = [];
  async function walk(d2, indent, remaining) {
    if (indent > depth || remaining.count <= 0) return;
    try {
      const entries = await readdir3(d2);
      for (const entry of entries) {
        if (remaining.count <= 0) break;
        if (SKIP_DIRS.has(entry) || entry.startsWith(".")) continue;
        const fullPath = join2(d2, entry);
        try {
          const s = await stat(fullPath);
          if (s.isDirectory()) {
            lines.push(`${"  ".repeat(indent)}${entry}/`);
            remaining.count--;
            await walk(fullPath, indent + 1, remaining);
          }
        } catch {
        }
      }
    } catch {
    }
  }
  await walk(dir, 0, { count: maxEntries });
  return lines.join("\n");
}
async function sampleImports(dir) {
  const extensions = [".ts", ".py", ".go"];
  const searchDirs = [join2(dir, "src"), dir];
  const imports = [];
  let filesScanned = 0;
  for (const searchDir of searchDirs) {
    if (filesScanned >= 5) break;
    try {
      const entries = await readdir3(searchDir);
      for (const entry of entries) {
        if (filesScanned >= 5) break;
        if (!extensions.some((ext) => entry.endsWith(ext))) continue;
        const content = await readFileSafe2(join2(searchDir, entry), 30);
        const importLines = content.split("\n").filter((line) => /^(?:import |from |require\()/.test(line.trim()));
        if (importLines.length > 0) {
          imports.push(`--- ${entry} ---`);
          imports.push(...importLines);
          filesScanned++;
        }
      }
    } catch {
    }
  }
  return imports.join("\n");
}
async function gatherProjectContext() {
  let ctx = "";
  const fileChecks = [
    { file: "package.json", label: "package.json", lines: 100 },
    { file: "tsconfig.json", label: "tsconfig.json", lines: 60 },
    { file: "go.mod", label: "go.mod", lines: 40 },
    { file: "Cargo.toml", label: "Cargo.toml", lines: 60 },
    { file: "Gemfile", label: "Gemfile", lines: 40 },
    { file: "pom.xml", label: "pom.xml (first 60 lines)", lines: 60 },
    { file: "build.gradle", label: "build.gradle (first 60 lines)", lines: 60 },
    { file: "build.gradle.kts", label: "build.gradle.kts (first 60 lines)", lines: 60 },
    { file: "pubspec.yaml", label: "pubspec.yaml", lines: 40 },
    { file: "requirements.txt", label: "requirements.txt (first 40 lines)", lines: 40 },
    { file: "setup.py", label: "setup.py (first 40 lines)", lines: 40 },
    { file: "setup.cfg", label: "setup.cfg (first 40 lines)", lines: 40 },
    { file: "pyproject.toml", label: "pyproject.toml (first 40 lines)", lines: 40 },
    { file: "Pipfile", label: "Pipfile (first 40 lines)", lines: 40 },
    { file: "composer.json", label: "composer.json (first 60 lines)", lines: 60 },
    { file: "README.md", label: "README.md (first 80 lines)", lines: 80 },
    { file: "CLAUDE.md", label: "CLAUDE.md (first 50 lines)", lines: 50 },
    { file: ".claude/CLAUDE.md", label: ".claude/CLAUDE.md (first 50 lines)", lines: 50 },
    { file: "Dockerfile", label: "Dockerfile (first 30 lines)", lines: 30 },
    { file: "docker-compose.yml", label: "docker-compose.yml (first 50 lines)", lines: 50 },
    { file: "docker-compose.yaml", label: "docker-compose.yaml (first 50 lines)", lines: 50 }
  ];
  for (const { file, label, lines } of fileChecks) {
    if (existsSync2(file)) {
      const content = await readFileSafe2(file, lines);
      ctx += `=== ${label} ===
${content}
`;
    }
  }
  try {
    const entries = await readdir3(".");
    const csproj = entries.find((e2) => e2.endsWith(".csproj"));
    if (csproj) {
      const content = await readFileSafe2(csproj, 40);
      ctx += `=== ${csproj} (first 40 lines) ===
${content}
`;
    }
  } catch {
  }
  try {
    if (existsSync2(".github/workflows")) {
      const workflows = await readdir3(".github/workflows");
      const firstYml = workflows.find((f2) => f2.endsWith(".yml") || f2.endsWith(".yaml"));
      if (firstYml) {
        const content = await readFileSafe2(join2(".github/workflows", firstYml), 40);
        ctx += `=== .github/workflows/${firstYml} (first 40 lines) ===
${content}
`;
      }
    }
  } catch {
  }
  const infraFiles = [
    ".github/workflows",
    ".gitlab-ci.yml",
    "Jenkinsfile",
    "terraform.tf",
    "main.tf",
    ".terraform",
    "k8s",
    "kubernetes",
    "Chart.yaml",
    "helmfile.yaml",
    ".eslintrc",
    ".eslintrc.js",
    ".eslintrc.json",
    "eslint.config.js",
    "eslint.config.mjs",
    ".prettierrc",
    "prettier.config.js",
    ".env.example",
    ".env.local",
    "prometheus.yml",
    "grafana"
  ];
  const infraSignals = [];
  for (const f2 of infraFiles) {
    if (existsSync2(f2)) {
      infraSignals.push(`  [exists] ${f2}`);
    }
  }
  if (infraSignals.length > 0) {
    ctx += `=== Infrastructure / config signals ===
${infraSignals.join("\n")}
`;
  }
  try {
    const entries = await readdir3(".");
    ctx += `=== Directory listing ===
${entries.slice(0, 40).join("\n")}
`;
  } catch {
  }
  try {
    const tree = await buildDirTree(".", 2, 60);
    if (tree) {
      ctx += `=== Directory tree (depth 2) ===
${tree}
`;
    }
  } catch {
  }
  try {
    const imports = await sampleImports(".");
    if (imports) {
      ctx += `=== Sample imports (first 5 source files) ===
${imports}
`;
    }
  } catch {
  }
  return ctx;
}
async function detectProjectAI() {
  const s = L2();
  s.start("Gathering project context...");
  const projectContext = await gatherProjectContext();
  if (!projectContext.trim()) {
    s.stop("AI detection failed: no project files found", 1);
    return null;
  }
  const prompt = `You are a project analyzer. Examine the project files below and detect technologies that are explicitly present as dependencies, config files, or source code.

Return ONLY a JSON object:
{
  "techs": [...],
  "skill_tags": [...],
  "archetypes": [...],
  "confidence": { "TechName": "high"|"medium", ... }
}

FIELD DEFINITIONS:
- techs: Human-readable names of technologies explicitly found (e.g. "React", "TypeScript", "Docker")
- skill_tags: Skill tags from VALID list that match detected technologies
- archetypes: Project archetypes from VALID list that describe this project's nature
- confidence: Object mapping each detected tech to a confidence level ("high" or "medium")
  - "high": The technology is a primary/core part of the project
  - "medium": The technology is a secondary dependency or utility

VALID SKILL TAGS: universal, web, react, nextjs, vue, angular, mobile, react-native, expo, flutter, ios, swift, android, kotlin, backend, nodejs, python, php, ruby, java, cpp, csharp, go, rust, typescript, devops, creative, documents, web3, ai
VALID ARCHETYPES: fullstack-web, api-backend, mobile-app, data-pipeline, ml-platform, devops-infra, cli-tool, e-commerce, saas, monorepo, library, microservices

RULES:
1. Only include a tag if there is concrete evidence in the project files.
2. Tag evidence requirements:
   - "devops": ONLY if Dockerfile, docker-compose, terraform, k8s manifests, CI/CD configs, or cloud SDK dependencies exist
   - "web": ONLY if frontend framework dependencies exist (React, Vue, Angular, Svelte) or HTML/CSS tooling is present
   - "mobile": ONLY if React Native, Flutter, Swift, Kotlin, or mobile SDK dependencies exist
   - "backend": ONLY if server frameworks (Express, Fastify, Django, Rails, etc.), database drivers, or API frameworks are dependencies
   - "ai": ONLY if AI/ML libraries are dependencies (e.g. langchain, openai, torch, transformers)
   - "web3": ONLY if blockchain/web3 libraries are dependencies (e.g. ethers, hardhat, foundry)
3. Return ONLY the JSON object, no other text.

PROJECT FILES:
${projectContext}`;
  s.message("Analyzing project with AI...");
  try {
    const { stdout } = await spawnWithStdin(
      "claude",
      ["-p", "--model", "sonnet", "--output-format", "text", "--max-budget-usd", "0.10"],
      prompt,
      { env: { ...process.env, CLAUDECODE: "" }, timeout: 45e3 }
    );
    if (!stdout.trim()) {
      s.stop("AI detection failed: empty response from AI", 1);
      return null;
    }
    const jsonStr = stdout.replace(/^```\w*\n?/gm, "").replace(/```$/gm, "").trim();
    let data;
    try {
      data = JSON.parse(jsonStr);
    } catch {
      s.stop("AI detection failed: could not parse AI response", 1);
      return null;
    }
    if (!data.techs || data.techs.length === 0) {
      s.stop("AI detection failed: no technologies detected", 1);
      return null;
    }
    s.stop("AI scan complete");
    const result = {
      techs: data.techs,
      skillTags: (data.skill_tags ?? []).filter((t) => VALID_SKILL_TAGS.has(t))
    };
    if (data.archetypes && Array.isArray(data.archetypes)) {
      const validArchetypes = data.archetypes.filter((a2) => VALID_ARCHETYPES.has(a2));
      if (validArchetypes.length > 0) {
        result.archetypes = validArchetypes;
      }
    }
    if (data.confidence && typeof data.confidence === "object") {
      const validConfidence = {};
      for (const [tech, level] of Object.entries(data.confidence)) {
        if (level === "high" || level === "medium") {
          validConfidence[tech] = level;
        }
      }
      if (Object.keys(validConfidence).length > 0) {
        result.confidence = validConfidence;
      }
    }
    return result;
  } catch (err) {
    const isTimeout = err instanceof Error && "killed" in err && err.killed;
    const reason = isTimeout ? "Claude CLI timed out (45s)" : "AI detection failed";
    s.stop(`AI detection failed: ${reason}`, 1);
    return null;
  }
}

// src/commands/scan.ts
var execFileAsync3 = promisify3(execFile3);
async function isClaudeCliAvailable() {
  try {
    await execFileAsync3("claude", ["--version"]);
    return true;
  } catch {
    return false;
  }
}
async function runDetection() {
  const isTTY = process.stdin.isTTY && process.stdout.isTTY;
  if (isTTY && await isClaudeCliAvailable()) {
    const useAI = await me({
      message: "Scan project with AI? (better detection)",
      initialValue: true
    });
    if (!BD(useAI) && useAI) {
      const aiResult = await detectProjectAI();
      if (aiResult && aiResult.techs.length > 0) return aiResult;
    }
  }
  return detectProject();
}
async function cmdScan() {
  const result = await runDetection();
  if (result.techs.length === 0) {
    console.log("");
    console.log(theme.warn("No project signals detected in current directory."));
    console.log(theme.dim("Run from a project root with package.json, go.mod, etc."));
    console.log("");
    return;
  }
  console.log("");
  console.log(theme.heading("Project scan results"));
  console.log("");
  console.log(`  ${theme.bold("Detected:")} ${result.techs.join(", ")}`);
  console.log("");
  console.log(`  ${theme.bold("Skill tags:")}`);
  for (const tag of result.skillTags) {
    console.log(`    ${theme.success("+")} ${tag}`);
  }
  if (result.archetypes?.length) {
    console.log("");
    console.log(`  ${theme.bold("Archetypes:")}`);
    for (const arch of result.archetypes) {
      console.log(`    ${theme.success("+")} ${arch}`);
    }
  }
  console.log("");
}

// src/prompts/checkbox.ts
var import_picocolors6 = __toESM(require_picocolors(), 1);
async function checkboxMenu(title, options, opts) {
  const preselected = opts?.preselected ?? [];
  const maxLabelLen = Math.max(...options.map((o) => o.label.length));
  const items = options.map((o) => ({
    label: o.description ? `${o.label.padEnd(maxLabelLen + 2)}${import_picocolors6.default.dim(`\u2014 ${o.description}`)}` : o.label,
    value: o.value
  }));
  const hint = opts?.showBack ? "space to toggle \xB7 enter to confirm \xB7 esc to go back" : "space to toggle \xB7 enter to confirm";
  const result = await pe({
    message: `${title}  ${import_picocolors6.default.dim(hint)}`,
    options: items,
    initialValues: preselected,
    required: false
  });
  if (BD(result)) {
    return null;
  }
  return result;
}

// src/commands/interactive.ts
async function cmdInteractive(scope, scopeSetByFlag2) {
  printBanner();
  const detection = await runDetection();
  if (detection.techs.length > 0) {
    console.log("");
    console.log(`  ${theme.success("Detected:")} ${theme.bold(detection.techs.join(", "))}`);
    if (detection.archetypes?.length) {
      console.log(`  ${theme.dim("Project type:")} ${detection.archetypes.join(", ")}`);
    }
  } else {
    console.log("");
    console.log(`  ${theme.warn("No project signals detected.")} Falling back to general skills.`);
  }
  const tags = detection.skillTags.length > 0 ? detection.skillTags : ["general"];
  const discoverSpinner = L2();
  discoverSpinner.start("Discovering skills from ecosystem...");
  let discovered;
  try {
    discovered = await discoverSkills(tags);
  } catch {
    discoverSpinner.stop("Discovery failed");
    console.log(theme.warn("Could not reach skills.sh. Check your internet connection."));
    return;
  }
  discoverSpinner.stop(`Found ${discovered.length} skills`);
  if (discovered.length === 0) {
    console.log(theme.warn("No matching skills found."));
    return;
  }
  const options = discovered.map((s) => ({
    label: s.name,
    description: `${s.installName}${s.isDefault ? " [recommended]" : ""}${s.description ? " \u2014 " + s.description : ""}`,
    value: s.name
  }));
  const preselected = discovered.filter((s) => s.isDefault || s.relevance >= 1).map((s) => s.name);
  console.log("");
  const selectedNames = await checkboxMenu("Select skills to install", options, { preselected });
  if (!selectedNames || selectedNames.length === 0) {
    console.log(theme.warn("No skills selected. Exiting."));
    process.exit(0);
  }
  const selectedSkills = discovered.filter((s) => selectedNames.includes(s.name));
  if (!scopeSetByFlag2) {
    console.log("");
    const scopeResult = await selectScopeMenu();
    if (scopeResult) scope = scopeResult;
  }
  console.log("");
  console.log(theme.bold(`Skills to install (${selectedSkills.length}):`));
  console.log(theme.dim(`  Scope: ${scope}`));
  console.log("");
  for (const skill of selectedSkills) {
    console.log(`  ${theme.success("+")} ${theme.bold(skill.name)}  ${theme.dim(skill.installName)}`);
  }
  console.log("");
  const confirm = await me({ message: "Install these skills?" });
  if (BD(confirm) || !confirm) {
    console.log(theme.warn("Installation cancelled."));
    process.exit(0);
  }
  const cwd = process.cwd();
  const installSpinner = L2();
  installSpinner.start(`Installing skills (0/${selectedSkills.length})...`);
  const result = await installDiscoveredSkills(selectedSkills, scope, cwd);
  installSpinner.stop(`Installed ${result.success} skills${result.failed > 0 ? ` (${result.failed} failed)` : ""}`);
  if (result.success > 0) {
    const installed = await getInstalledSkillMetadata(cwd);
    await updateClaudeMd(installed, scope);
  }
}

// src/bin.ts
var program2 = new Command();
var installScope = "project";
var scopeSetByFlag = false;
program2.name("superpower-installer").description("Smart skill installer for Claude Code \u2014 scans your project, discovers skills").version(getVersion(), "-v, --version").option(
  "--scope <scope>",
  "Installation scope: project, user, or local",
  (value) => {
    if (!["project", "user", "local"].includes(value)) {
      console.error(`Error: invalid scope '${value}'. Use: user, project, local`);
      process.exit(1);
    }
    installScope = value;
    scopeSetByFlag = true;
    return value;
  }
).option("-l, --list", "List installed skills").option("-s, --search [term]", "Search & install skills from ecosystem").option("-u, --update", "Update installed skills").option("--scan", "Detect project tech stack");
program2.action(async (opts) => {
  try {
    if (opts.list) {
      await cmdList();
    } else if (opts.search !== void 0) {
      const term = typeof opts.search === "string" ? opts.search : "";
      await cmdSearch(term, installScope, scopeSetByFlag);
    } else if (opts.update) {
      await cmdUpdate();
    } else if (opts.scan) {
      await cmdScan();
    } else {
      await cmdInteractive(installScope, scopeSetByFlag);
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error: ${err.message}`);
    }
    process.exit(1);
  }
});
program2.parse();
