import { Channel, ConsumeMessage } from 'amqplib';
import { ChannelWrapper } from 'amqp-connection-manager';
import { RabbitAdapter } from './adapter';

export type ConsumerOptions = {
  queue: string;
  prefetch?: number;
};

export abstract class RabbitConsumer<Input = any> {
  private adapter: RabbitAdapter;
  private channel: ChannelWrapper;
  private options: ConsumerOptions;

  constructor(options: ConsumerOptions) {
    this.adapter = new RabbitAdapter();
    this.options = options;
  }

  public abstract handleMessage(
    data: Input,
    msg: ConsumeMessage,
  ): Promise<void>;

  public async connect(): Promise<void> {
    await this.adapter.connect();
    await this.createChannel();
  }

  private async createChannel(): Promise<void> {
    this.channel = this.adapter.createChannel(
      {
        confirm: false,
        setup: async (channel: Channel) => {
          const { queue, prefetch } = this.options;

          if (!queue) {
            console.log('Lack of queue before creating consumer.');
            process.exit(1);
          }

          await Promise.all([
            channel.assertQueue(queue, { durable: true }),
            channel.prefetch(prefetch || 1),
            channel.consume(
              queue,
              async (msg: ConsumeMessage | null) => {
                if (!msg) return;

                try {
                  const data = this.transform(msg);
                  if (!data) return await this.commit(msg);
                  await this.handleMessage(data, msg);
                } catch (error: any) {
                  console.log('Fail to handle msg %j: %s', msg, error.stack);
                  return await this.reject(msg);
                }
              },
              { noAck: true },
            ),
          ]);
        },
      },
      this.options.queue,
    );

    await this.channel.waitForConnect();
  }

  private transform(msg: ConsumeMessage): Input | null {
    try {
      const data = JSON.parse(msg.content.toString()) as Input;
      return data;
    } catch (error: any) {
      console.log('Fail to transform msg %j: %s', msg, error.stack);
      return null;
    }
  }

  public async commit(msg: ConsumeMessage): Promise<void> {
    await this.channel.ack(msg);
  }

  public async reject(msg: ConsumeMessage): Promise<void> {
    await this.channel.nack(msg);
  }

  public async release(): Promise<void> {
    this.channel?.close();
    await this.adapter?.release();
  }
}
