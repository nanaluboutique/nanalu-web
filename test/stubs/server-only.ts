// Empty stand-in for the `server-only` package, used ONLY by vitest.db.config.ts.
//
// The real `server-only` package exports a module that throws the instant it is
// imported outside Next's server bundler — its job is to stop a Client Component
// from pulling server code into the browser. Our data layer (src/lib/db.ts) imports
// it for exactly that guarantee. But a DB-integration test deliberately imports that
// same server data layer in a plain Node process, where the real package would throw
// on load. The db config aliases `server-only` to this empty module so the import is
// a harmless no-op there. Nothing else references this file.
export {};
