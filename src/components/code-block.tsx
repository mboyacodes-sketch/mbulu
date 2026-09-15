"use client";

import { Children, isValidElement, useMemo, type ReactNode } from "react";
import hljs from "highlight.js/lib/core";

import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import go from "highlight.js/lib/languages/go";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdown from "highlight.js/lib/languages/markdown";
import python from "highlight.js/lib/languages/python";
import ruby from "highlight.js/lib/languages/ruby";
import rust from "highlight.js/lib/languages/rust";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";

let registered = false;

function ensureLanguages() {
  if (registered) return;
  hljs.registerLanguage("bash", bash);
  hljs.registerLanguage("sh", bash);
  hljs.registerLanguage("shell", bash);
  hljs.registerLanguage("zsh", bash);
  hljs.registerLanguage("css", css);
  hljs.registerLanguage("go", go);
  hljs.registerLanguage("java", java);
  hljs.registerLanguage("javascript", javascript);
  hljs.registerLanguage("js", javascript);
  hljs.registerLanguage("jsx", javascript);
  hljs.registerLanguage("json", json);
  hljs.registerLanguage("markdown", markdown);
  hljs.registerLanguage("md", markdown);
  hljs.registerLanguage("python", python);
  hljs.registerLanguage("py", python);
  hljs.registerLanguage("ruby", ruby);
  hljs.registerLanguage("rb", ruby);
  hljs.registerLanguage("rust", rust);
  hljs.registerLanguage("rs", rust);
  hljs.registerLanguage("sql", sql);
  hljs.registerLanguage("typescript", typescript);
  hljs.registerLanguage("ts", typescript);
  hljs.registerLanguage("tsx", typescript);
  hljs.registerLanguage("xml", xml);
  hljs.registerLanguage("html", xml);
  hljs.registerLanguage("yaml", yaml);
  hljs.registerLanguage("yml", yaml);
  registered = true;
}

const LANGUAGE_LABELS: Record<string, string> = {
  bash: "Bash",
  sh: "Shell",
  shell: "Shell",
  zsh: "Zsh",
  css: "CSS",
  go: "Go",
  java: "Java",
  javascript: "JavaScript",
  js: "JavaScript",
  jsx: "JSX",
  json: "JSON",
  markdown: "Markdown",
  md: "Markdown",
  python: "Python",
  py: "Python",
  ruby: "Ruby",
  rb: "Ruby",
  rust: "Rust",
  rs: "Rust",
  sql: "SQL",
  typescript: "TypeScript",
  ts: "TypeScript",
  tsx: "TSX",
  xml: "XML",
  html: "HTML",
  yaml: "YAML",
  yml: "YAML",
  text: "Text",
  plaintext: "Text",
};

function labelFor(language: string) {
  return LANGUAGE_LABELS[language.toLowerCase()] ?? language;
}

function extractCode(children: ReactNode): { code: string; className?: string } {
  const items = Children.toArray(children);
  for (const child of items) {
    if (!isValidElement<{ className?: string; children?: ReactNode }>(child)) {
      continue;
    }
    return {
      code: String(child.props.children ?? "").replace(/\n$/, ""),
      className: child.props.className,
    };
  }

  return { code: String(children).replace(/\n$/, "") };
}

type CodeBlockProps = {
  children?: ReactNode;
  className?: string;
};

export function CodeBlock({ children, className }: CodeBlockProps) {
  ensureLanguages();

  const { html, language } = useMemo(() => {
    const extracted = extractCode(children);
    const hinted =
      /language-([a-z0-9_+-]+)/i.exec(className ?? extracted.className ?? "")?.[1] ??
      "";

    if (hinted && hljs.getLanguage(hinted)) {
      return {
        language: hinted.toLowerCase(),
        html: hljs.highlight(extracted.code, { language: hinted }).value,
      };
    }

    const auto = hljs.highlightAuto(extracted.code, [
      "javascript",
      "typescript",
      "python",
      "bash",
      "json",
      "html",
      "css",
      "sql",
      "go",
      "rust",
      "ruby",
      "java",
      "yaml",
      "markdown",
    ]);

    return {
      language: (auto.language ?? (hinted || "text")).toLowerCase(),
      html:
        auto.value ||
        hljs.highlight(extracted.code, { language: "markdown" }).value,
    };
  }, [children, className]);

  return (
    <div className="md-codeblock" data-language={language}>
      <div className="md-codeblock-bar">
        <span className="md-codeblock-lang">{labelFor(language)}</span>
      </div>
      <pre className="md-codeblock-pre">
        <code
          className={`hljs language-${language}`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </pre>
    </div>
  );
}
