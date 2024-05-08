import { Config } from "./config";

// Type of messages from Extension to Webview
export class ExtMessageType {
  public static readonly CONFIG = "CONFIG";
  public static readonly DATA = "DATA";
  public static readonly RELOAD = "RELOAD";

  public static isCONFIG(msg: ExtMessage): msg is ExtConfigMessage {
    return msg.type === ExtMessageType.CONFIG;
  }

  public static isDATA(msg: ExtMessage): msg is ExtDataMessage {
    return msg.type === ExtMessageType.DATA;
  }

  public static isRELOAD(msg: ExtMessage): msg is ExtReloadMessage {
    return msg.type === ExtMessageType.RELOAD;
  }
}

export type ExtMessage = ExtConfigMessage | ExtDataMessage | ExtReloadMessage;

export class ExtConfigMessage {
  type = ExtMessageType.CONFIG;
  data: Config;
}

export class ExtDataMessage {
  type = ExtMessageType.DATA;
  data: ExtDataMessageData;
}

export interface ExtDataMessageData {
  samples: ArrayBufferLike;
  start: number;
  end: number;
  wholeLength: number;
}

export class ExtReloadMessage {
  type = ExtMessageType.RELOAD;
}

// Type of messages from Webview to Extension
export class WebviewMessageType {
  public static readonly CONFIG = "CONFIG";
  public static readonly DATA = "DATA";
  public static readonly ERROR = "RELOAD";

  public static isCONFIG(msg: WebviewMessage): msg is WebviewConfigMessage {
    return msg.type === WebviewMessageType.CONFIG;
  }

  public static isDATA(msg: WebviewMessage): msg is WebviewDataMessage {
    return msg.type === WebviewMessageType.DATA;
  }

  public static isERROR(msg: WebviewMessage): msg is WebviewErrorMessage {
    return msg.type === WebviewMessageType.ERROR;
  }
}

export type WebviewMessage =
  | WebviewConfigMessage
  | WebviewDataMessage
  | WebviewErrorMessage;

export class WebviewConfigMessage {
  type = WebviewMessageType.CONFIG;
}

export class WebviewDataMessage {
  type = WebviewMessageType.DATA;
  data: WebviewDataMessageData;
}

export interface WebviewDataMessageData {
  start: number;
  end: number;
}

export class WebviewErrorMessage {
  type = WebviewMessageType.ERROR;
  data: WebviewErrorMessageData;
}

export interface WebviewErrorMessageData {
  message: string;
}

// Type of post message funtion
export type PostMessage = (message: WebviewMessage) => void;
