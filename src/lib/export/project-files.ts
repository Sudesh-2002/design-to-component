export type ProjectFiles = Record<string, string>;

/** "Pricing card with 3 tiers!" → "pricing-card-with-3-tiers" (valid npm package name) */
export function toSlug(text: string, fallback = "component-export"): string {
  const slug = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  return slug || fallback;
}

export function buildProjectFiles(code: string, name: string): ProjectFiles {
  const pkg = {
    name,
    private: true,
    version: "0.0.0",
    type: "module",
    scripts: {
      dev: "vite",
      build: "vite build",
      preview: "vite preview",
      typecheck: "tsc --noEmit",
    },
    dependencies: {
      react: "18.3.1",
      "react-dom": "18.3.1",
    },
    devDependencies: {
      "@types/react": "18.3.12",
      "@types/react-dom": "18.3.1",
      "@vitejs/plugin-react": "4.3.4",
      autoprefixer: "10.4.20",
      postcss: "8.4.49",
      tailwindcss: "3.4.17",
      typescript: "5.6.3",
      vite: "5.4.11",
    },
  };

  const tsconfig = {
    compilerOptions: {
      target: "ES2020",
      useDefineForClassFields: true,
      lib: ["ES2020", "DOM", "DOM.Iterable"],
      module: "ESNext",
      moduleResolution: "bundler",
      skipLibCheck: true,
      isolatedModules: true,
      noEmit: true,
      jsx: "react-jsx",
      strict: true,
    },
    include: ["src"],
  };

  return {
    "package.json": JSON.stringify(pkg, null, 2) + "\n",
    "tsconfig.json": JSON.stringify(tsconfig, null, 2) + "\n",

    "index.html": `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,

    "vite.config.ts": `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
`,

    "tailwind.config.js": `/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
`,

    "postcss.config.js": `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`,

    ".gitignore": `node_modules
dist
*.local
`,

    "README.md": `# ${name}

Generated with Design to Component Playground.

\`\`\`bash
npm install
npm run dev
\`\`\`

The component lives in \`src/Component.tsx\`.
`,

    "src/vite-env.d.ts": `/// <reference types="vite/client" />
`,

    "src/index.css": `@tailwind base;
@tailwind components;
@tailwind utilities;
`,

    "src/main.tsx": `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Component from "./Component";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Component />
  </StrictMode>
);
`,

    "src/Component.tsx": code.trimEnd() + "\n",
  };
}