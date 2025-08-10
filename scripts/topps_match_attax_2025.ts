import { ScriptArgs } from "..";
import { LastStickerScrapper } from "../api/utils/laststicker.scrapper";
const URL =
  "https://www.laststicker.com/cards/topps_ucc_2024-2025_match_attax/";
const name = "topps_match_attax_2025";

const script = async (args: ScriptArgs) => {
  await LastStickerScrapper.start(URL, name, args);
};

export default script;
