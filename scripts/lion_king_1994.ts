import { LastStickerScrapper } from "../utils/laststicker.scrapper";
import { ScriptArgs } from "..";

const script = async (args: ScriptArgs) => {
  const url = "https://www.laststicker.com/cards/panini_lion_king/";

  await LastStickerScrapper.start(url, "lion_king_1994", args);
};

export default script;
