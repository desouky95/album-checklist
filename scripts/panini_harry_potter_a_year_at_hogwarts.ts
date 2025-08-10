import { ScriptArgs } from "..";
import { LastStickerScrapper } from "../api/utils/laststicker.scrapper";

const script = async (args: ScriptArgs) => {
  await LastStickerScrapper.start(
    "https://www.laststicker.com/cards/panini_harry_potter_a_year_at_hogwarts/",
    "panini_harry_potter_a_year_at_hogwarts",
    args
  );
};

export default script;
