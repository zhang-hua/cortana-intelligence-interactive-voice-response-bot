import { Connection, ConnectionOptions } from 'tedious';

export type ReadyCallback = (err: Error, connection: Connection) => void;

export class SqlClient {
  private queue: ReadyCallback[] = [];
  private connection: Connection;
  private connected: boolean | Error = false;

  constructor(private options: ConnectionOptions) {
    this.connection = new Connection(options);
    this.connection.on('connect', (err: Error) => this.onConnected(err));
  }

  ready(callback: ReadyCallback): void {
    if (this.connected === false) {
      this.queue.push(callback);
    } else {
      this.onReady(callback);
    }
  }

  private onConnected(err: Error): void {
    this.connected = err || true;
    if (this.queue.length) {
      this.queue.forEach((x) => this.onReady(x));
      this.queue.length = 0;
    }
  }

  private onReady(callback: ReadyCallback): void {
    if (this.connected instanceof Error) {
      setImmediate(callback, this.connected, null);
    } else {
      setImmediate(callback, null, this.connection);
    }
  }
}
