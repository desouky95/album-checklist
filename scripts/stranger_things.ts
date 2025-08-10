import { ScriptArgs } from "..";
import { LastStickerScrapper } from "../api/utils/laststicker.scrapper";

const script = async (args: ScriptArgs) => {
  await LastStickerScrapper.start(
    "https://www.laststicker.com/cards/panini_stranger_things-2/",
    "panini_stranger_things_2",
    args
  );
};

export default script;
