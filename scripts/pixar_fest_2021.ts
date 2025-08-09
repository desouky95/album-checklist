import { LastStickerScrapper } from "../utils/laststicker.scrapper";

const script = async () => {
  console.log("Pixar Fest 2021 script is not implemented yet.");

  await LastStickerScrapper.start(
    "https://www.laststicker.com/cards/panini_pixar_fest/",
    "pixar_fest_2021"
  );
};

export default script;
