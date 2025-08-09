import { ScriptArgs } from "..";
import { LastStickerScrapper } from "../utils/laststicker.scrapper";

const script = async (args: ScriptArgs) => {
  await LastStickerScrapper.start(
    "https://www.laststicker.com/cards/panini_naruto_shippuden_un_nouveau_depart/",
    "panini_naruto_shippuden",
    args
  );
};

export default script;
