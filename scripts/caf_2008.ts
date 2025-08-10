import { ScriptArgs } from "..";
import { LastStickerScrapper } from "../api/utils/laststicker.scrapper";

const script = async (args: ScriptArgs) => {
  await LastStickerScrapper.start(
    "https://www.laststicker.com/cards/panini_africa_cup_2008/",
    "caf_2008",
    args
  );
};

export default script;
