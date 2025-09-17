import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
// @ts-expect-error bleh
import pulumi from "@pulumi/eslint-plugin";

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    plugins: { pulumi },
    rules: {
      "pulumi/no-output-in-template-literal": "error",
    },
  },
);
