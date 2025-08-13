import * as Cheerio from "cheerio";
import { existsSync, mkdirSync } from "fs";
import { ScriptArgs } from "..";
import * as fs from "fs";
import puppeteer from "puppeteer-extra";

import axios from "axios";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import { SingleBar } from "cli-progress";
import colors from "ansi-colors";
import { Cookie } from "puppeteer";
import { setTimeout as wait } from "timers/promises";
import ora, { Ora, spinners } from "ora";
import Table from "cli-table";
import { Excel } from "./excel.generator";
import UserAgent from "user-agents";
import {
  getCookies,
  PuppeteerCookie,
  getCookiesPromised,
} from "chrome-cookies-secure";
const stealth = StealthPlugin();

// stealth.enabledEvasions.delete("iframe.contentWindow");
// stealth.enabledEvasions.delete("media.codecs");
// stealth.enabledEvasions.delete("user-agent-override");
puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

type Sheets = {
  Cards: string[][];
  Missing: string[][];
  Duplicates: string[][];
};
type AlbumInformation = {
  name: string;
  year: string;
  publisher: string;
};

export type CardResult = {
  imageURL: string | undefined;
  number: string;
  title: string;
  section: string;
  url: string;
  imagePath: string;
  type: string;
  row: {
    html: string;
    el: HTMLTableRowElement;
  };
};
type EntryDataResult = {
  number: string;
  title: string;
  section: string;
  url: string | null;
  row: {
    html: string;
    el: HTMLTableRowElement;
  };
  type: string;
};

export class LastStickerScrapper {
  private static instance: LastStickerScrapper;
  private baseURL = "https://www.laststicker.com";
  url: string;
  cookies: PuppeteerCookie[] = [];
  args: ScriptArgs;
  outputName: string;
  sheets: Sheets = {
    Cards: [[]],
    Duplicates: [[]],
    Missing: [[]],
  };
  cards: CardResult[] = [];
  private albumName!: string;
  private albumYear!: string;
  private publisher!: string;
  private spinner!: Ora;
  excel!: Excel;
  private constructor(url: string, outputName: string, args: ScriptArgs) {
    this.url = url;
    this.args = args;
    this.outputName = outputName;
    this.spinner = ora({
      spinner: spinners.triangle,
      color: "cyan",
      isEnabled: true,
    });
    this.excel = new Excel();
  }

  static async start(
    url: string,
    outputName: string,
    args: ScriptArgs = { clearCache: false }
  ) {
    if (LastStickerScrapper.instance) {
      return LastStickerScrapper.instance;
    }
    LastStickerScrapper.instance = new LastStickerScrapper(
      url,
      outputName,
      args
    );
    try {
      await LastStickerScrapper.instance.run(args);
      return LastStickerScrapper.instance;
    } catch (error) {
      throw error;
    }
  }

  private async checkImageFolder() {
    if (!existsSync(`./data/${this.outputName}/images`)) {
      this.spinner.info("Creating images folder");
      mkdirSync(`./data/${this.outputName}/images`, { recursive: true });
      this.spinner.succeed("Images folder created");
    }
  }
  private async getJSONData() {
    this.spinner.start("Scraping data...");

    const url = "https://www.google.com";

    this.cookies = await this.getCookies();
    const browser = await puppeteer.launch({
      browserURL: "http://127.0.0.1:9222",
      args: ["--window-size=1920,1080", "--no-sandbox"],
      headless: false,
      targetFilter: (target) => {
        if (target.type() === "other" && target.url() === "") {
          return false;
        }
        return true;
      },
    });

    await browser.setCookie(...this.cookies);
    const page = await browser.newPage();

    // await page.setUserAgent(
    //   "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.79 Safari/537.36"
    // );
    // await page.setUserAgent(new UserAgent().random().toString());

    await page.goto(this.url, { waitUntil: "load" });

    await page.waitForSelector("#content > h1", {
      visible: true,
      timeout: 60000,
    });

    const rows = await page.$$eval("table#checklist tbody tr", (el) => {
      return el.map((el) => ({ html: el.innerHTML, el }));
    });

    await this.checkImageFolder();
    const data = await Promise.all(
      rows.map(async (row, _index) => {
        const $ = Cheerio.load(`<tbody>${row.html}</tbody>`, {}, false);
        const number = $("td").eq(0).text().trim();
        const title = $("td").eq(1).text().trim();
        const section = $("td").eq(2).text().trim();
        const type = $("td").eq(3).text().trim();
        let url = $("a").attr("href")
          ? `${this.baseURL}` + $("a").attr("href")
          : null;
        return {
          number,
          title,
          section,
          url,
          row,
          type,
        };
      })
    );
    // console.log(await page.content());
    this.albumName = await page.$eval("#content > h1", (p) => p.innerText);
    this.albumYear = await page.$eval(".big_text > span", (p) =>
      p.innerText.split(":")[1].trim()
    );
    this.publisher = await page.$eval(
      '#content > a[href*="/publishers/"]',
      (p) => p.attributes.getNamedItem("href")?.textContent?.split("/")[2] || ""
    );

    let cards: CardResult[] = [];
    if (this.args.withImages) {
      const progress = new SingleBar({
        format:
          "CLI Progress |" +
          colors.cyan("{bar}") +
          "| {percentage}% || {value}/{total} Images",
        barCompleteChar: "\u2588",
        barIncompleteChar: "\u2591",
        hideCursor: true,
      });

      progress.start(data.length, 0, {});
      for (let i = 0; i < data.length; i++) {
        progress.increment();
        const path = `./data/${this.outputName}/images/${data[i].number}.png`;
        if (existsSync(path)) {
          cards.push({
            ...(data[i] as any),
            imageURL: path,
          });
          continue;
        }
        if (!this.args.withImages) continue;
        await new Promise((resolve) => {
          setTimeout(async () => {
            const card = await this.$evalRow(data[i]);
            const { imageURL, number } = card;
            if (imageURL) {
              const imageBuffer = await axios.get(imageURL, {
                responseType: "arraybuffer",
              });
              const image = Buffer.from(imageBuffer.data, "binary");
              const path = `./data/${this.outputName}/images/${number}.png`;
              fs.writeFileSync(path, image, {
                encoding: "binary",
              });
              cards.push({ ...card, imagePath: path });
            } else cards.push(card);
            resolve(true);
          }, 1000);
        });
      }
      progress.stop();
    } else {
      cards = data.map(
        (d) => ({ ...d, imagePath: "", imageURL: "" } as CardResult)
      );
    }

    await browser.close();

    if (!existsSync(`./data`)) {
      mkdirSync(`./data`, { recursive: true });
    }

    this.spinner.succeed("Data scraped successfully.");
    const cliTable = new Table({
      head: ["Album", "Year", "Publisher", "Cards"],
    });

    cliTable.push([
      this.albumName,
      this.albumYear,
      this.publisher,
      cards.length.toString(),
    ]);
    console.log(cliTable.toString());
    const result = {
      data,
      information: {
        name: this.albumName,
        year: this.albumYear,
        publisher: this.publisher,
      },
    };
    fs.writeFileSync(`./data/${this.outputName}.json`, JSON.stringify(result));
  }

  private async $evalRow(row: EntryDataResult) {
    const browser = await puppeteer.launch({
      args: ["--window-size=1920,1080", "--no-sandbox"],
    });
    const cardPage = await browser.newPage();
    await browser.setCookie(...this.cookies);
    const { url, number } = row;
    let imageURL: string | undefined;
    if (!url) return row as any as CardResult;
    await cardPage.setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36"
    );
    await cardPage.setExtraHTTPHeaders({
      "Accept-Language": "en",
    });
    try {
      // await browser.waitForTarget((target) => target.url().includes(url));
      await cardPage.goto(url, { waitUntil: "networkidle2" });
      imageURL = await cardPage.$eval('img[src*="/i/cards"]', (el) => {
        return el.src;
      });
      await cardPage.close();
    } catch (error: any) {
      console.error(
        `Error fetching image for card ${number}: ${error.message}`
      );
      imageURL = undefined;
    }
    await browser.close();
    return { ...row, imageURL } as any as CardResult;
  }

  private isDataExist() {
    this.spinner.start(colors.cyan("Checking if data exist..."));
    if (!existsSync(`./data/${this.outputName}.json`)) {
      this.spinner.fail("No data found.");
      return false;
    }

    this.spinner.succeed(`${this.outputName} :: Data found.`);
    return (
      JSON.parse(fs.readFileSync(`./data/${this.outputName}.json`, "utf-8"))
        ?.data?.length > 0
    );
  }

  private getData() {
    return JSON.parse(
      fs.readFileSync(`./data/${this.outputName}.json`, "utf-8")
    ) as { information: AlbumInformation | null; data: CardResult[] };
  }

  private async login() {
    const browser = await puppeteer.launch({
      headless: false,
      args: ["--window-size=1920,1080", "--no-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto(this.baseURL, { waitUntil: "networkidle2" });
    const username = await page.$("#f_login");
    const password = await page.$("#f_password");
    await username?.type("desouky95");
    await password?.type("0100929164");
    const submit = await page.$("#form_submit");
    await submit?.click();
    await wait(4000);
    this.cookies = await browser.cookies();
    await browser.close();
  }

  private async getCookies() {
    const cookies = await getCookiesPromised(this.url, "puppeteer");
    return cookies;
  }
  async run(args: ScriptArgs) {
    this.args = args;

    if (this.args.withAuth) {
      this.spinner.start("Logging in...");
      await this.login();
      this.spinner.succeed("Login successful.");
    }
    if (args.clearCache && this.isDataExist()) {
      this.spinner.start("Clearing data...");
      fs.rmSync(`./data/${this.outputName}.json)}`, {
        recursive: true,
        force: true,
      });
      this.spinner.stopAndPersist({ text: "Data cleared successfully." });
      await this.getJSONData();
    }
    if (!this.isDataExist()) {
      console.warn("No data found. Generating new data...");
      await this.getJSONData();
    }

    const data = this.getData();
    this.spinner.succeed(`Found ${data.data.length} cards.`);
    this.albumName = data.information?.name || "";
    this.albumYear = data.information?.year || "";
    this.publisher = data.information?.publisher || "";
    const cards = data.data;
    this.spinner.start("Generating output...");
    await this.excel.generate(cards, {
      albumName: this.albumName,
      albumYear: this.albumYear,
      publisher: this.publisher,
      outputName: this.outputName,
      withGrid: this.args.grid || false,
    });

    const outputName = this.args.grid
      ? `${this.outputName}-grid`
      : this.outputName;

    const file = fs.readFileSync(`./output/${outputName}.xlsx`);

    this.spinner.succeed("Output generated successfully.");
    return file;
  }
}
