import type { ProjectFiles } from "./project-files";

export function openInStackBlitz(
  files: ProjectFiles,
  opts: { title: string; description?: string }
) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = "https://stackblitz.com/run?file=src/Component.tsx";
  form.target = "_blank";
  form.rel = "noopener";
  form.style.display = "none";

  const add = (name: string, value: string) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  };

  add("project[title]", opts.title);
  add(
    "project[description]",
    opts.description ?? "Generated with Design to Component Playground"
  );
  add("project[template]", "node");

  for (const [path, content] of Object.entries(files)) {
    add(`project[files][${path}]`, content);
  }

  add(
    "project[files][.stackblitzrc]",
    JSON.stringify({ installDependencies: true, startCommand: "npm run dev" })
  );

  document.body.appendChild(form);
  form.submit();
  form.remove();
}