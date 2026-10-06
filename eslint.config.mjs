import eslintConfigPrettier from "eslint-config-prettier/flat";
import { createConfigForNuxt } from "@nuxt/eslint-config";

export default createConfigForNuxt({ features: { tooling: false } })
  .append({
    ignores: [".nuxt/**", ".output/**", ".nitro/**", "dist/**", "generated/**"],
  })
  .append({
    rules: {
      "vue/attributes-order": "off",
    },
  })
  .append(eslintConfigPrettier);
