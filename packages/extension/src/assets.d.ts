/**
 * Asset module declarations.
 *
 * Vite resolves `import url from './foo.svg'` to a URL string at build time
 * (or inlines as a data URI for files under the configured asset size
 * threshold). The default export is always a string. TypeScript needs this
 * declaration so plain `import logoUrl from './x.svg'` type-checks under
 * strict mode.
 */

declare module '*.svg' {
  const url: string;
  export default url;
}

declare module '*.svg?inline' {
  const dataUri: string;
  export default dataUri;
}

declare module '*.svg?url' {
  const url: string;
  export default url;
}

declare module '*.jpg' {
  const url: string;
  export default url;
}

declare module '*.jpg?inline' {
  const dataUri: string;
  export default dataUri;
}
