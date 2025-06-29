import { Capacitor } from '@capacitor/core';

class Logger {
  private static instance: Logger;
  private isNative: boolean;

  private constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(type: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${type}] ${message}${dataStr}`;
  }

  public log(message: string, data?: any) {
    const formattedMessage = this.formatMessage('LOG', message, data);
    if (this.isNative) {
      console.log(formattedMessage);
    } else {
      console.log(formattedMessage);
    }
  }

  public error(message: string, error?: any) {
    const formattedMessage = this.formatMessage('ERROR', message, error);
    if (this.isNative) {
      console.error(formattedMessage);
    } else {
      console.error(formattedMessage);
    }
  }

  public debug(message: string, data?: any) {
    const formattedMessage = this.formatMessage('DEBUG', message, data);
    if (this.isNative) {
      console.debug(formattedMessage);
    } else {
      console.debug(formattedMessage);
    }
  }

  public info(message: string, data?: any) {
    const formattedMessage = this.formatMessage('INFO', message, data);
    if (this.isNative) {
      console.info(formattedMessage);
    } else {
      console.info(formattedMessage);
    }
  }
}

export const logger = Logger.getInstance(); 