export interface DatabaseEngine {
  connect: () => Promise<void>;

  close: () => Promise<void>;

  drop: () => Promise<void>;
}
