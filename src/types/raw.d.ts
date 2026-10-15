/**
 * Vite resolves `?raw` imports to the file contents as a string. Declaring it
 * here keeps `readFileSync` out of the test suite: pulling in `@types/node`
 * would retype `setTimeout` across the whole project (`NodeJS.Timeout` instead
 * of the DOM's `number`), which is a large blast radius for reading one file.
 */
declare module '*.css?raw' {
  const content: string;
  export default content;
}
