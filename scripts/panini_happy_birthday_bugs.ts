import { ScriptArgs } from "..";
import { LastStickerScrapper } from "../utils/laststicker.scrapper";

export default async function script(args: ScriptArgs) {
  await LastStickerScrapper.start(
    "https://www.laststicker.com/cards/panini_happy_birthday_bugs/",
    "panini_happy_birthday_bugs",
    args
  );
}
