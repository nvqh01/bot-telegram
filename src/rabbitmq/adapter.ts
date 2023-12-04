import {
  AmqpConnectionManager,
  AmqpConnectionManagerClass,
  CreateChannelOpts,
} from 'amqp-connection-manager';
import { sleep } from '../utils';

const RABBIT_URI = 'amqp://admin:admin123@localhost:5672';

export class RabbitAdapter {
  private connectionManager: AmqpConnectionManager;

  constructor() {}

  public async connect(): Promise<void> {
    try {
      this.connectionManager = new AmqpConnectionManagerClass(RABBIT_URI);
      await this.connectionManager.connect();

      this.connectionManager.on('connect', () => {
        console.log('Created connection to RabbitMQ.');
      });

      this.connectionManager.on('disconnect', ({ err }) => {
        console.log('Disconnect to RabbitMQ: ' + err.stack);
      });
    } catch (error: any) {
      console.log('Fail to create connection to RabbitMQ: ' + error.stack);
      await sleep(3_000);
      return await this.connect();
    }
  }

  public createChannel(options: CreateChannelOpts, queue: string) {
    const channel = this.connectionManager.createChannel({
      json: true,
      ...options,
    });

    channel.on('close', () => {
      console.log('Closed channel (queue: %s).', queue);
    });

    channel.on('connect', () => {
      console.log('Connected channel (queue: %s).', queue);
    });

    channel.on('error', (error) => {
      console.log('Channel (queue: %s) meets error: %s', queue, error.stack);
    });

    return channel;
  }

  public async release() {
    this.connectionManager?.close();
  }
}
