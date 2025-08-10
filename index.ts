import { program } from "commander";
import { select } from "@inquirer/prompts";
import { readdirSync } from "node:fs";

const getScripts = async () => {
  try {
    const files = readdirSync("./scripts");
    return files;
  } catch (error) {
    throw new Error("Failed to read scripts directory");
  }
};

program
  .name("album checklist")
  .option("-c, --clear-cache", "Clear cache", false)
  .option("-i, --with-images", "Download images", false)
  .option("-a, --with-auth", "With auth", false)
  .option("-g, --grid", "Use grid", false)
  .option("-s, --single", "Single mode", false)
  .action(async (args = {}) => {
    const script = await select<string>({
      message: "Select a script to run",
      choices: await getScripts(),
    });
    try {
      const { default: selectedScript } = await import(`./scripts/${script}`);
      await selectedScript(args);
    } catch (error) {
      console.error(`Failed to run script ${script}:`, error);
    }
  });

program.parse();

export type ScriptArgs = {
  clearCache: boolean;
  withImages?: boolean;
  withAuth?: boolean;
  grid?: boolean;
  single?: boolean;
  isBrowser?: boolean;
};
