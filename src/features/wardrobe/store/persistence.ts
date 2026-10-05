import {
  wardrobeDataSchema,
  type WardrobeData,
} from "@/features/wardrobe/domain/validation";

/**
 * Versioned persistence for the wardrobe.
 *
 * Storage key is intentionally the historical `wardrope-store` spelling so
 * existing saved wardrobes keep working.
 *
 * Envelope version history:
 *   0 - legacy shape written by the previous zustand `persist` middleware
 *       (`{ state, version: 0 }` or a bare state object).
 *   1 - current envelope (`{ version, savedAt, state }`).
 *
 * Conflict detection compares the exact raw bytes this tab loaded with the
 * bytes currently on disk. No content hash is used for safety decisions.
 */
export const STORAGE_KEY = "wardrope-store";
export const SCHEMA_VERSION = 1;
export const LEGACY_VERSION = 0;
export const STORAGE_LOCK = "wardrope-store-write";

export type StorageLoadResult =
  | { status: "empty" }
  | { status: "ok"; data: WardrobeData; migrated: boolean; raw: string }
  | { status: "invalid"; reason: string; raw: string }
  | { status: "future"; reason: string; raw: string }
  | { status: "unavailable"; reason: string };

export type ParsedStorage =
  | { status: "ok"; data: WardrobeData; migrated: boolean }
  | { status: "invalid"; reason: string }
  | { status: "future"; reason: string };

/** Raised when the on-disk snapshot no longer matches what this tab loaded. */
export class StorageConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageConflictError";
  }
}

/** Raised when a write could not be performed (unavailable storage, locks, quota). */
export class StorageWriteError extends Error {
  readonly quota: boolean;

  constructor(message: string, quota: boolean) {
    super(message);
    this.name = "StorageWriteError";
    this.quota = quota;
  }
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getStorage = (): Storage | null => {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
};

export function isQuotaError(error: unknown): boolean {
  if (typeof DOMException !== "undefined" && error instanceof DOMException) {
    return (
      error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      error.code === 22 ||
      error.code === 1014
    );
  }
  if (error instanceof Error) {
    return /quota|storage full|exceeded/i.test(`${error.name} ${error.message}`);
  }
  return false;
}

export function describeStorageError(error: unknown): string {
  if (isQuotaError(error)) return "Local storage is full.";
  if (error instanceof Error && error.message) return error.message;
  return "Local storage could not be accessed.";
}

export function buildEnvelope(data: WardrobeData): {
  version: number;
  savedAt: string;
  state: WardrobeData;
} {
  return {
    version: SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    state: data,
  };
}

type VersionRead =
  | { ok: true; version: number }
  | { ok: false; reason: string };

function readVersion(value: Record<string, unknown>): VersionRead {
  if (!("version" in value) || value.version === undefined) {
    return { ok: true, version: LEGACY_VERSION };
  }
  const version = value.version;
  if (
    typeof version !== "number" ||
    !Number.isInteger(version) ||
    version < 0
  ) {
    return { ok: false, reason: "Saved data has an invalid version marker." };
  }
  return { ok: true, version };
}

function migrateLegacy(candidate: Record<string, unknown>): Record<string, unknown> {
  const migrated: Record<string, unknown> = { ...candidate };
  if (typeof migrated.setupComplete !== "boolean") {
    migrated.setupComplete = Array.isArray(migrated.categories)
      ? migrated.categories.length > 0
      : false;
  }
  return migrated;
}

/**
 * Parse and validate a stored or exported payload. Never mutates storage and
 * never repairs invalid graphs; callers decide whether to surface recovery.
 */
export function parseStoredValue(raw: string): ParsedStorage {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { status: "invalid", reason: "Saved data is not valid JSON." };
  }
  if (!isPlainObject(value)) {
    return { status: "invalid", reason: "Saved data has an unexpected shape." };
  }
  const versionRead = readVersion(value);
  if (!versionRead.ok) {
    return { status: "invalid", reason: versionRead.reason };
  }
  const version = versionRead.version;
  if (version > SCHEMA_VERSION) {
    return {
      status: "future",
      reason: `Saved data uses a newer format (version ${version}) that this version of the app cannot read.`,
    };
  }

  let candidate: unknown;
  if (version >= SCHEMA_VERSION) {
    if (!isPlainObject(value.state)) {
      return { status: "invalid", reason: "Saved data is missing its wardrobe state." };
    }
    candidate = value.state;
  } else if (isPlainObject(value.state)) {
    candidate = value.state;
  } else {
    candidate = value;
  }

  if (!isPlainObject(candidate)) {
    return { status: "invalid", reason: "Saved wardrobe state has an unexpected shape." };
  }

  const migrated = version < SCHEMA_VERSION ? migrateLegacy(candidate) : candidate;
  const result = wardrobeDataSchema.safeParse(migrated);
  if (!result.success) {
    return {
      status: "invalid",
      reason: result.error.issues[0]?.message ?? "Saved wardrobe data is invalid.",
    };
  }
  return {
    status: "ok",
    data: result.data,
    migrated: version < SCHEMA_VERSION,
  };
}

export function loadWardrobe(): StorageLoadResult {
  let raw: string | null;
  try {
    const storage = getStorage();
    if (!storage) {
      return {
        status: "unavailable",
        reason:
          "Local storage is not available in this browser, so the wardrobe cannot be loaded or saved.",
      };
    }
    raw = storage.getItem(STORAGE_KEY);
  } catch (error) {
    return { status: "unavailable", reason: describeStorageError(error) };
  }

  // Only a missing key is an empty wardrobe. An empty string is malformed
  // stored data and must be preserved rather than treated as empty.
  if (raw === null) return { status: "empty" };

  const parsed = parseStoredValue(raw);
  if (parsed.status === "invalid") {
    return { status: "invalid", reason: parsed.reason, raw };
  }
  if (parsed.status === "future") {
    return { status: "future", reason: parsed.reason, raw };
  }
  return {
    status: "ok",
    data: parsed.data,
    migrated: parsed.migrated,
    raw,
  };
}

async function withWriteLock<T>(operation: () => T | Promise<T>): Promise<T> {
  const locks =
    typeof navigator !== "undefined" ? navigator.locks : undefined;
  if (!locks || typeof locks.request !== "function") {
    throw new StorageWriteError(
      "This browser cannot guarantee safe cross-tab writes because Web Locks is unavailable, so saving is disabled to avoid data loss. Open the app in a supported browser or tab.",
      false,
    );
  }
  return locks.request(STORAGE_LOCK, { mode: "exclusive" }, () =>
    Promise.resolve(operation()),
  );
}

function readRaw(storage: Storage): string | null {
  try {
    return storage.getItem(STORAGE_KEY);
  } catch (error) {
    throw new StorageWriteError(describeStorageError(error), false);
  }
}

/**
 * Write validated data to storage. The exact bytes currently on disk must
 * match `expectedRaw` (null means this tab loaded an empty wardrobe); a
 * mismatch raises `StorageConflictError` and leaves existing bytes untouched.
 * Returns the raw bytes that were written.
 */
export async function persistWardrobe(
  data: WardrobeData,
  expectedRaw: string | null,
): Promise<string> {
  return withWriteLock(() => {
    const storage = getStorage();
    if (!storage) {
      throw new StorageWriteError(
        "Local storage is not available; changes cannot be saved.",
        false,
      );
    }
    if (readRaw(storage) !== expectedRaw) {
      throw new StorageConflictError(
        "This wardrobe was changed in another tab or process. Reload to continue.",
      );
    }
    const raw = JSON.stringify(buildEnvelope(data));
    try {
      storage.setItem(STORAGE_KEY, raw);
    } catch (error) {
      throw new StorageWriteError(describeStorageError(error), isQuotaError(error));
    }
    return raw;
  });
}

/**
 * Remove stored bytes only when the disk still matches the bytes this tab
 * loaded. Used exclusively by a confirmed reset.
 */
export async function clearWardrobe(expectedRaw: string | null): Promise<void> {
  return withWriteLock(() => {
    const storage = getStorage();
    if (!storage) {
      throw new StorageWriteError(
        "Local storage is not available; nothing could be cleared.",
        false,
      );
    }
    if (readRaw(storage) !== expectedRaw) {
      throw new StorageConflictError(
        "This wardrobe changed since it was loaded. Reload before resetting.",
      );
    }
    try {
      storage.removeItem(STORAGE_KEY);
    } catch (error) {
      throw new StorageWriteError(describeStorageError(error), false);
    }
  });
}
