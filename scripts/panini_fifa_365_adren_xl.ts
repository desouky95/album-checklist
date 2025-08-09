import { ScriptArgs } from "..";
import { LastStickerScrapper } from "../utils/laststicker.scrapper";

const script = async (args: ScriptArgs) => {
  await LastStickerScrapper.start(
    "https://www.laststicker.com/cards/panini_fifa_365_2024-2025_adrenalyn_xl/",
    "panini_fifa_365_adren_xl",
    args
  );
};


export default script
