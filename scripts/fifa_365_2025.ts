import { LastStickerScrapper } from "../utils/laststicker.scrapper";
import { ScriptArgs } from "..";


const script = async (args: ScriptArgs) => {
  await LastStickerScrapper.start(
    "https://www.laststicker.com/cards/panini_fifa_365_2024-2025/",
    "fifa_365_2025",
    args
  );
};

export default script;
