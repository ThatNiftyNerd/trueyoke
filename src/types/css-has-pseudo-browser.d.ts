// css-has-pseudo ships type declarations for its main PostCSS-plugin export
// but not for the "/browser" runtime-polyfill subpath used in src/main.tsx.
declare module "css-has-pseudo/browser" {
  export default function cssHasPseudo(document: Document): void;
}
