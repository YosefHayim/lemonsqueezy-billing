import { createWriteStream } from "node:fs";
import { resolve } from "node:path";
import { WizardState } from "@wizard/types.js";
import { generateConfigContent, generateExampleContent } from "@wizard/utils/file-generation.js";
import { runValidationTests } from "@wizard/utils/validation.js";
import prompts from "prompts";
import chalk from "chalk";

export async function stepGenerateFiles(state: WizardState): Promise<void> {
  console.log("\n" + chalk.dim("Navigation: ENTER to generate, ESC to exit"));
  
  console.log("\n" + chalk.dim("Generate configuration files? (use SPACE to select, ENTER to submit):"));
  const response = await prompts({
    type: "multiselect",
    name: "generate",
    message: "Generate configuration files:",
    choices: [
      { title: "Yes, generate files", value: "yes" },
      { title: "No, exit without generating", value: "no" }
    ],
    instructions: false,
    hint: "Space to select, Enter to submit",
    onState: (state: any) => {
      if (state.aborted) throw new Error('Aborted');
    }
  });

  if (!response.generate.includes("yes")) {
    console.log("[-] Exiting without generating files");
    process.exit(0);
  }

  await generateFiles(state);
  
  // Run validation tests after file generation
  await runValidationTests();
}

async function generateFiles(state: WizardState): Promise<void> {
  const configContent = generateConfigContent(state);
  const exampleContent = generateExampleContent(state);

  const configPath = resolve(process.cwd(), "billing-config.ts");
  const examplePath = resolve(process.cwd(), "example.ts");

  // Write config file
  const configStream = createWriteStream(configPath);
  configStream.write(configContent);
  configStream.end();

  // Write example file
  const exampleStream = createWriteStream(examplePath);
  exampleStream.write(exampleContent);
  exampleStream.end();

  // Wait for both streams to finish
  await Promise.all([
    new Promise<void>((resolve) => configStream.on('finish', resolve)),
    new Promise<void>((resolve) => exampleStream.on('finish', resolve))
  ]);

  console.log("\n[+] Files generated successfully!");
  console.log(`📁 ${configPath}`);
  console.log(`📁 ${examplePath}`);
  
  console.log("\n🚀 Next steps:");
  console.log("1. Review the generated files");
  console.log("2. Run: node example.ts");
  console.log("3. Start building your billing integration!");
}