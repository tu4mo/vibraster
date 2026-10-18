import react from "@vitejs/plugin-react";
import { defineConfig, lazyPlugins } from "vite-plus";

// https://vite.dev/config/
export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {},
  lint: {
    categories: {
      correctness: "error",
      suspicious: "error",
    },
    plugins: ["eslint", "import", "oxc", "react", "typescript", "unicorn"],
    rules: {
      "react/react-in-jsx-scope": "off",
      // Effects return a cleanup on some paths and nothing on early bail-outs.
      "typescript/consistent-return": "off",
      "import/no-unassigned-import": ["error", { allow: ["**/*.css"] }],
      "react/rules-of-hooks": "error",
      "react/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
        },
      ],
      "vite-plus/prefer-vite-plus-imports": "error",
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
    jsPlugins: [
      {
        name: "vite-plus",
        specifier: "vite-plus/oxlint-plugin",
      },
    ],
  },
  // React Compiler via the experimental Rust port (oxc-transform-react). The
  // build logs any component it has to skip.
  plugins: lazyPlugins(() => [react({ compiler: { logDiagnostics: true } })]),
});
