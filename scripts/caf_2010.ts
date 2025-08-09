import { ScriptArgs } from "..";
import { LastStickerScrapper } from "../utils/laststicker.scrapper";

const script = async (args: ScriptArgs) => {
  await LastStickerScrapper.start(
    "https://www.laststicker.com/cards/panini_africa_cup_2010/",
    "caf_2010",
    args
  );
};

export default script;
