"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const prompts_1 = require("@inquirer/prompts");
const node_fs_1 = require("node:fs");
const getScripts = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const files = (0, node_fs_1.readdirSync)("./scripts");
        return files;
    }
    catch (error) {
        throw new Error("Failed to read scripts directory");
    }
});
commander_1.program
    .name("album checklist")
    .option("-c, --clear-cache", "Clear cache", false)
    .option("-i, --with-images", "Download images", false)
    .option("-a, --with-auth", "With auth", false)
    .option("-g, --grid", "Use grid", false)
    .option("-s, --single", "Single mode", false)
    .action((...args_1) => __awaiter(void 0, [...args_1], void 0, function* (args = {}) {
    const script = yield (0, prompts_1.select)({
        message: "Select a script to run",
        choices: yield getScripts(),
    });
    try {
        const { default: selectedScript } = yield Promise.resolve(`${`./scripts/${script}`}`).then(s => __importStar(require(s)));
        yield selectedScript(args);
    }
    catch (error) {
        console.error(`Failed to run script ${script}:`, error);
    }
}));
commander_1.program.parse();
