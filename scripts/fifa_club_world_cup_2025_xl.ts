import { ScriptArgs } from "..";
import { LastStickerScrapper } from "../api/utils/laststicker.scrapper";

export default async function script(args: ScriptArgs) {
  await LastStickerScrapper.start(
    "https://www.laststicker.com/cards/panini_fifa_club_world_cup_2025_adrenalyn_xl/",
    "fifa_club_world_cup_2025_xl",
    args
  );
}
