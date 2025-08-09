import test from "node:test";
import { connect } from "puppeteer-real-browser";

test("Puppeteer Extra Plugin", async () => {
  const { page, browser } = await connect({
    args: ["--start-maximized"],
    turnstile: true,
    headless: false,
    // disableXvfb: true,
    customConfig: {},
    connectOption: {
      defaultViewport: null,
    },
    plugins: [require("puppeteer-extra-plugin-click-and-wait")()],
  });

  await page.goto("https://google.com", { waitUntil: "domcontentloaded" });
  await page.clickAndWaitForNavigation("body");
  await browser.close();
});
