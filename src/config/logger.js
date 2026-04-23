import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import chalk from "chalk";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_DIR = path.join(__dirname, "../../logs");

const LOG_LEVELS = {
  levels: { error: 0, warn: 1, info: 2, http: 3, debug: 4 },
  colors: {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    debug: "cyan",
  },
};

winston.addColors(LOG_LEVELS.colors);

const isDev = process.env.NODE_ENV !== "production";
const activeLevel = isDev ? "debug" : "warn";

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    const colorMap = {
      error: chalk.red.bold,
      warn: chalk.yellow.bold,
      info: chalk.green.bold,
      http: chalk.magenta.bold,
      debug: chalk.cyan.bold,
    };
    const colorize = colorMap[level] || chalk.white;
    const metaStr = Object.keys(meta).length
      ? chalk.gray("\n  Meta: " + JSON.stringify(meta, null, 2))
      : "";
    const stackStr = stack ? chalk.red("\n" + stack) : "";

    return (
      chalk.gray(`[${timestamp}] `) +
      colorize(`[${level.toUpperCase()}] `) +
      message +
      metaStr +
      stackStr
    );
  })
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const levelFilter = (allowedLevels) =>
  winston.format((info) => (allowedLevels.includes(info.level) ? info : false))();

const transports = [];

if (isDev) {
  transports.push(
    new winston.transports.Console({
      level: "debug",
      format: consoleFormat,
    })
  );
}

transports.push(
  new DailyRotateFile({
    level: "debug",
    dirname: path.join(LOG_DIR, "combined"),
    filename: "combined-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    maxFiles: "14d",
    maxSize: "20m",
    format: winston.format.combine(
      levelFilter(["error", "warn", "info", "http"]),
      fileFormat
    ),
    zippedArchive: true,
  })
);

transports.push(
  new DailyRotateFile({
    level: "debug",
    dirname: path.join(LOG_DIR, "errors"),
    filename: "error-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    maxFiles: "30d",
    maxSize: "10m",
    format: winston.format.combine(levelFilter(["error"]), fileFormat),
    zippedArchive: true,
  })
);

transports.push(
  new DailyRotateFile({
    level: "debug",
    dirname: path.join(LOG_DIR, "http"),
    filename: "http-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    maxFiles: "7d",
    format: winston.format.combine(levelFilter(["http"]), fileFormat),
    zippedArchive: true,
  })
);

const logger = winston.createLogger({
  levels: LOG_LEVELS.levels,
  level: activeLevel,
  transports,
  exitOnError: false,
});

export default logger;
