import { ScriptArgs } from "..";
import { LastStickerScrapper } from "../utils/laststicker.scrapper";

const script = async (args: ScriptArgs) => {
  await LastStickerScrapper.start(
    "https://www.laststicker.com/cards/coop_il_giro_del_mondo/",
    "wwf_superstars",
    args
  );
};

export default script
