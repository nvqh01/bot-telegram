import { Request, launchPuppeteer, puppeteerUtils, sleep } from 'crawlee';
import { Browser, Page } from 'puppeteer';
import puppeteerExtra from 'puppeteer-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import { newInjectedPage } from 'fingerprint-injector';
import fs, { appendFileSync } from 'fs';

let browser: Browser;

(async () => {
  puppeteerExtra.use(stealthPlugin());

  browser = await launchPuppeteer({
    launcher: puppeteerExtra,
    launchOptions: {
      args: [
        '--autoplay-policy=user-gesture-required',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-client-side-phishing-detection',
        '--disable-component-update',
        '--disable-default-apps',
        '--disable-dev-shm-usage',
        '--disable-domain-reliability',
        '--disable-extensions',
        '--disable-features=AudioServiceOutOfProcess',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-notifications',
        '--disable-offer-store-unmasked-wallet-cards',
        '--disable-popup-blocking',
        '--disable-print-preview',
        '--disable-prompt-on-repost',
        '--disable-renderer-backgrounding',
        '--disable-setuid-sandbox',
        '--disable-speech-api',
        '--disable-sync',
        '--hide-scrollbars',
        '--ignore-gpu-blacklist',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-default-browser-check',
        '--no-first-run',
        '--no-pings',
        '--no-sandbox',
        '--no-zygote',
        '--password-store=basic',
        '--use-gl=swiftshader',
        '--use-mock-keychain',
      ],
      headless: false,
      userDataDir: './.puppeteer/userData',
    },
    useChrome: false,
    useIncognitoPages: true,
  });

  const page = await newInjectedPage(browser, {
    fingerprintOptions: {
      browsers: ['chrome'],
      devices: ['desktop'],
      locales: ['en-US'],
      operatingSystems: ['windows', 'linux'],
      strict: true,
    },
  });

  const request = new Request({
    // url: 'https://thanhnien.vn/luat-can-cuoc-bo-sung-thu-thap-mong-mat-vao-co-so-du-lieu-185231127082706213.htm',
    url: 'https://twitter.com/elonmusk/likes',
  });

  // await puppeteerUtils.blockRequests(page, {
  //   urlPatterns: [
  //     // '.css',
  //     '.jpg',
  //     '.jpeg',
  //     '.png',
  //     '.svg',
  //     // '.gif',
  //     // '.woff',
  //     // '.pdf',
  //     // '.zip',
  //   ],
  // });

  await page.setCookie({
    name: 'auth_token',
    value: '512b67c92cb46fcdf312f01152eab06c228737dd',
    domain: '.twitter.com',
    path: '/',
    expires: 1736176375.078041,
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    sameParty: false,
    sourceScheme: 'Secure',
    sourcePort: 443,
  });

  await puppeteerUtils.gotoExtended(page, request, {
    waitUntil: 'load',
    timeout: 60_000,
  });

  let num1 = 0;
  puppeteerUtils.infiniteScroll(page, {
    timeoutSecs: 20,
    // maxScrollHeight: 100,
    waitForSecs: 20,
    stopScrollCallback: () => {
      if (num1++ > 15) return true;
    },
  });

  await sleep(600_000);

  // await page.setRequestInterception(true);

  // page.on('request', (request) => {
  //   // if (
  //   //   request.resourceType() === 'fetch' ||
  //   //   request.resourceType() === 'xhr'
  //   // ) {
  //   //   const url = request.url();
  //   //   if (/^https:\/\/twitter.com\/i\/api\/graphql\/.+\/Likes/gi.test(url)) {
  //   //     const res = request.response();
  //   //     console.log(request);
  //   //     console.log(res);
  //   //     console.log(url);

  //   //     // fs.appendFileSync('result.txt', `${JSON.stringify(res)} --- ${url}`, {
  //   //     //   encoding: 'utf8',
  //   //     // });
  //   //   }
  //   // }
  //   request.continue();
  // });

  // page.on('response', async (response) => {
  //   const url = response.url();

  //   if (/^https:\/\/twitter.com\/i\/api\/graphql\/.+\/Likes/gi.test(url)) {
  //     const result = await response.json();

  //     fs.appendFileSync('result.txt', JSON.stringify(result, null, 2), {
  //       encoding: 'utf8',
  //     });

  //     console.log(response.status());
  //     console.log(url);
  //   }
  // });

  const usernameSelector =
    '#layers > div > div > div > div > div > div > div.css-175oi2r.r-1ny4l3l.r-18u37iz.r-1pi2tsx.r-1777fci.r-1xcajam.r-ipm5af.r-g6jmlv.r-1awozwy > div.css-175oi2r.r-1wbh5a2.r-htvplk.r-1udh08x.r-1867qdf.r-kwpbio.r-rsyp9y.r-1pjcn9w.r-1279nm1 > div > div > div.css-175oi2r.r-1ny4l3l.r-6koalj.r-16y2uox.r-kemksi.r-1wbh5a2 > div.css-175oi2r.r-16y2uox.r-1wbh5a2.r-1jgb5lz.r-13qz1uu.r-1ye8kvj > div > div > div > div.css-175oi2r.r-1f1sjgu.r-mk0yit.r-13qz1uu > label > div > div.css-175oi2r.r-18u37iz.r-16y2uox.r-1wbh5a2.r-1wzrnnt.r-1udh08x.r-xd6kpl.r-1pn2ns4.r-ttdzmv > div > input';
  await page.waitForSelector(usernameSelector, {
    timeout: 60_000,
  });
  await page.type(usernameSelector, 'asmodeus2k1', { delay: 250 });

  const nextSelector =
    '#layers > div > div > div > div > div > div > div.css-175oi2r.r-1ny4l3l.r-18u37iz.r-1pi2tsx.r-1777fci.r-1xcajam.r-ipm5af.r-g6jmlv.r-1awozwy > div.css-175oi2r.r-1wbh5a2.r-htvplk.r-1udh08x.r-1867qdf.r-kwpbio.r-rsyp9y.r-1pjcn9w.r-1279nm1 > div > div > div.css-175oi2r.r-1ny4l3l.r-6koalj.r-16y2uox.r-kemksi.r-1wbh5a2 > div.css-175oi2r.r-16y2uox.r-1wbh5a2.r-1jgb5lz.r-13qz1uu.r-1ye8kvj > div > div > div > div:nth-child(6)';
  await page.waitForSelector(nextSelector, {
    timeout: 60_000,
  });
  await page.click(nextSelector);

  const passwordSelector =
    '#layers > div > div > div > div > div > div > div.css-175oi2r.r-1ny4l3l.r-18u37iz.r-1pi2tsx.r-1777fci.r-1xcajam.r-ipm5af.r-g6jmlv.r-1awozwy > div.css-175oi2r.r-1wbh5a2.r-htvplk.r-1udh08x.r-1867qdf.r-kwpbio.r-rsyp9y.r-1pjcn9w.r-1279nm1 > div > div > div.css-175oi2r.r-1ny4l3l.r-6koalj.r-16y2uox.r-kemksi.r-1wbh5a2 > div.css-175oi2r.r-16y2uox.r-1wbh5a2.r-1jgb5lz.r-13qz1uu.r-1ye8kvj > div.css-175oi2r.r-16y2uox.r-1wbh5a2.r-1dqxon3 > div > div > div.css-175oi2r.r-mk0yit.r-13qz1uu > div > label > div > div.css-175oi2r.r-18u37iz.r-16y2uox.r-1wbh5a2.r-1wzrnnt.r-1udh08x.r-xd6kpl.r-1pn2ns4.r-ttdzmv > div.css-1rynq56.r-bcqeeo.r-qvutc0.r-37j5jr.r-135wba7.r-16dba41.r-1awozwy.r-6koalj.r-1inkyih.r-13qz1uu > input';
  await page.waitForSelector(passwordSelector, {
    timeout: 60_000,
  });
  await page.type(passwordSelector, '@Huy3062k1', { delay: 500 });

  const loginSelector =
    '#layers > div > div > div > div > div > div > div.css-175oi2r.r-1ny4l3l.r-18u37iz.r-1pi2tsx.r-1777fci.r-1xcajam.r-ipm5af.r-g6jmlv.r-1awozwy > div.css-175oi2r.r-1wbh5a2.r-htvplk.r-1udh08x.r-1867qdf.r-kwpbio.r-rsyp9y.r-1pjcn9w.r-1279nm1 > div > div > div.css-175oi2r.r-1ny4l3l.r-6koalj.r-16y2uox.r-kemksi.r-1wbh5a2 > div.css-175oi2r.r-16y2uox.r-1wbh5a2.r-1jgb5lz.r-13qz1uu.r-1ye8kvj > div.css-175oi2r.r-1isdzm1 > div > div.css-175oi2r > div > div > div';
  await page.waitForSelector(loginSelector, {
    timeout: 60_000,
  });
  await page.click(loginSelector);

  // await page.waitForSelector('body', { timeout: 60_000 });
  await sleep(30_000);
  let num = 0;

  await puppeteerUtils.infiniteScroll(page, {
    timeoutSecs: 4,
    // waitForSecs: 4,
    // scrollDownAndUp: true,
    stopScrollCallback: () => {
      console.log('Check...');
      if (num++ >= 10) return true;
      // return false;
    },
  });

  console.log('Finished...');

  // await sleep(60_000);

  const cookies = await page.cookies();
  appendFileSync('cookies.txt', JSON.stringify(cookies, null, 2), {
    encoding: 'utf8',
  });

  // await sleep(600_000);
  await browser.close();
})().catch((error) => {
  console.log(error);
  browser.close();
  process.exit(1);
});

process.on('SIGINT', () => browser.close());
