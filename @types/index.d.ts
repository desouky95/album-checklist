declare module "puppeteer-real-browser" {
  import { Page } from "puppeteer";
  interface PageWithCursor extends Page {
    clickAndWaitForNavigation(args: any): any;
  }
}

declare module 'image-size/fromFile' {
  export function imageSizeFromFile(filePath: string): Promise<{ width: number, height: number }>
}