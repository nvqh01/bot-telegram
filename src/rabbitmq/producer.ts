import { ChannelWrapper } from 'amqp-connection-manager';
import { RabbitAdapter } from './adapter';
import { Channel } from 'amqplib';

export type ProducerOptions = {
  queue: string;
  exchange?: string;
  routingKey?: string;
};

export abstract class RabbitProducer<Output = any> {
  private adapter: RabbitAdapter;
  private channel: ChannelWrapper;
  private options: ProducerOptions;

  constructor(options: ProducerOptions) {
    this.adapter = new RabbitAdapter();
    this.options = options;
  }

  public async connect(): Promise<void> {
    await this.adapter.connect();
    await this.createChannel();
  }

  private async createChannel(): Promise<void> {
    this.channel = this.adapter.createChannel(
      {
        confirm: true,
        setup: async (channel: Channel) => {
          const { queue, exchange, routingKey } = this.options;

          if (!queue) {
            console.log('Lack of queue before creating producer.');
            process.exit(1);
          }

          if (exchange && routingKey) {
            return await Promise.all([
              channel.assertQueue(queue, { durable: true }),
              channel.assertExchange(exchange, 'topic', { durable: true }),
              channel.bindQueue(queue, exchange, routingKey),
            ]);
          }

          return await Promise.all([
            channel.assertQueue(queue, { durable: true }),
          ]);
        },
      },
      this.options.queue,
    );

    await this.channel.waitForConnect();
  }

  public async sendToQueue(data: Output): Promise<void> {
    const { queue } = this.options;
    await this.channel.sendToQueue(queue, JSON.stringify(data), {
      persistent: true,
    });
  }

  public async publish(data: Output): Promise<void> {
    const { exchange, routingKey } = this.options;

    if (!exchange || !routingKey) {
      console.log(
        'Can not publish to exchange because of lack of exchange or routing key.',
      );
      process.exit(1);
    }

    await this.channel.publish(exchange, routingKey, JSON.stringify(data), {
      persistent: true,
    });
  }

  public async release(): Promise<void> {
    this.channel?.close();
    await this.adapter?.release();
  }
}
