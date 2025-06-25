export enum LogLevel {
  DEBUG = "debug",
  ERROR = "error",
  INFO = "info",
  WARN = "warn",
}

export interface LogEntry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context?: Record<string, any>;
  level: LogLevel;
  message: string;
  timestamp: Date;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;

  private constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  private log(
    level: LogLevel,
    message: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context?: Record<string, any>,
  ): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      context,
      level,
      message,
      timestamp: new Date(),
    };

    console.error(JSON.stringify(entry, null, 2));
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [
      LogLevel.ERROR,
      LogLevel.WARN,
      LogLevel.INFO,
      LogLevel.DEBUG,
    ];
    return levels.indexOf(level) <= levels.indexOf(this.logLevel);
  }
}
