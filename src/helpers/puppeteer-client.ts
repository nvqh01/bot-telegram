import { PuppeteerLaunchContext, launchPuppeteer } from 'crawlee';
import { Browser, Page } from 'puppeteer';

export class PuppeteerClient {
  private browser: Browser;
  private pages: Page[];

  constructor(private options?: PuppeteerLaunchContext) {}

  async createBrowser(): Promise<void> {
    this.browser = await launchPuppeteer(this.options || {});
  }

  async getPage(): Promise<Page> {
    !this.browser && (await this.createBrowser());
    const page = await this.browser.newPage();
    return page;
  }

  async release(): Promise<void> {
    await Promise.all(this.pages.map(async (page) => await page.close()));
    this.browser && (await this.browser.close());
  }
}
