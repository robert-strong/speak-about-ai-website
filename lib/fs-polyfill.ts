/**
 * Minimal fs polyfill for runtimes (e.g. edge / Next.js) where certain
 * Node.js fs APIs are not implemented. It silently returns an empty array
 * so libraries like `glob` / `path-scurry` don’t crash when they call
 * `fs.readdir` or `fs.readdirSync`.
 *
 * NOTE: This runs in every environment, but only patches when the
 *       functions are missing, so it is safe on Node.
 */
import fs from "fs"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fsAny = fs as any

if (typeof fsAny.readdir !== "function") {
  fsAny.readdir = (_path: string, _opts: any, cb: (err: null, files: string[]) => void) => {
    // support the signature (path, cb)
    if (typeof _opts === "function") cb = _opts
    cb?.(null, [])
  }
}

if (typeof fsAny.readdirSync !== "function") {
  fsAny.readdirSync = () => []
}
