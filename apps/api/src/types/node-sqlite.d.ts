/**
 * Minimal type declarations for Node's built-in `node:sqlite` module
 * (experimental as of Node 22). We hand-declare only the surface this
 * project uses instead of depending on a specific @types/node version
 * that may or may not ship them yet.
 */
declare module 'node:sqlite' {
  export interface StatementResultingChanges {
    changes: number | bigint;
    lastInsertRowid: number | bigint;
  }

  export class StatementSync {
    run(...params: unknown[]): StatementResultingChanges;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  }

  export class DatabaseSync {
    constructor(path: string, options?: Record<string, unknown>);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
