import { PuppeteerCrawler, sleep } from 'crawlee';

const crawler = new PuppeteerCrawler({
  launchContext: {
    launchOptions: {
      headless: false,
    },
  },
  requestHandler: async (ctx) => {
    await sleep(120_000);
  },
});

crawler
  .run(['https://twitter.com/elonmusk/likes'])
  .then((result) => {
    console.log('Finished');
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
