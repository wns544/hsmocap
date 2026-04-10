import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectId = "hsmocap-d907e";
const databasePath = `projects/${projectId}/databases/(default)`;
const seedPath = resolve(__dirname, "../../src/app/data/seedWords.json");
const firebaseToolsPathCandidates = [
  resolve(process.env.HOME ?? "", ".config/configstore/firebase-tools.json"),
  resolve(process.env.USERPROFILE ?? "", ".config/configstore/firebase-tools.json"),
  resolve("/mnt/c/Users/wns54/.config/configstore/firebase-tools.json"),
];

const seedWords = JSON.parse(readFileSync(seedPath, "utf8"));

function readFirebaseToolsConfig() {
  for (const candidate of firebaseToolsPathCandidates) {
    try {
      const data = JSON.parse(readFileSync(candidate, "utf8"));
      if (data.tokens?.refresh_token) {
        return data;
      }
    } catch {
      continue;
    }
  }

  throw new Error("Firebase CLI login cache with refresh token was not found.");
}

async function getAccessToken() {
  const config = readFirebaseToolsConfig();
  const refreshToken = config.tokens.refresh_token;

  const body = new URLSearchParams({
    client_id: "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com",
    client_secret: "j9iVZfS8kkCEFUPaAeJV0sAi",
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed with status ${response.status}`);
  }

  const data = await response.json();
  if (typeof data.access_token !== "string" || !data.access_token) {
    throw new Error("Token refresh response did not contain an access token.");
  }

  return data.access_token;
}

function toFirestoreValue(value) {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }

  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map(toFirestoreValue),
      },
    };
  }

  switch (typeof value) {
    case "string":
      return { stringValue: value };
    case "boolean":
      return { booleanValue: value };
    case "number":
      if (Number.isInteger(value)) {
        return { integerValue: value.toString() };
      }
      return { doubleValue: value };
    case "object":
      return {
        mapValue: {
          fields: Object.fromEntries(
            Object.entries(value).map(([key, nestedValue]) => [key, toFirestoreValue(nestedValue)]),
          ),
        },
      };
    default:
      return { stringValue: String(value) };
  }
}

async function firestoreRequest(path, accessToken, init = {}) {
  const response = await fetch(`https://firestore.googleapis.com/v1/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Firestore request failed (${response.status}): ${text}`);
  }

  return response;
}

async function listExistingWords(accessToken) {
  const documents = [];
  let pageToken = "";

  while (true) {
    const query = new URLSearchParams({
      pageSize: "300",
    });
    if (pageToken) {
      query.set("pageToken", pageToken);
    }

    const response = await firestoreRequest(
      `${databasePath}/documents/words?${query.toString()}`,
      accessToken,
      { method: "GET", headers: { "Content-Type": "application/json" } },
    );
    const data = await response.json();
    const pageDocuments = Array.isArray(data.documents) ? data.documents : [];
    for (const document of pageDocuments) {
      if (typeof document.name === "string") {
        documents.push(document);
      }
    }

    if (!data.nextPageToken) {
      break;
    }
    pageToken = data.nextPageToken;
  }

  return documents;
}

async function commitWrites(writes, accessToken) {
  if (writes.length === 0) {
    return;
  }

  await firestoreRequest(`${databasePath}/documents:commit`, accessToken, {
    method: "POST",
    body: JSON.stringify({ writes }),
  });
}

async function deleteExistingWords(accessToken) {
  const documents = await listExistingWords(accessToken);
  const names = documents.map((document) => document.name);

  for (let index = 0; index < names.length; index += 400) {
    const chunk = names.slice(index, index + 400);
    await commitWrites(
      chunk.map((name) => ({
        delete: name,
      })),
      accessToken,
    );
  }

  return names.length;
}

async function insertSeedWords(accessToken) {
  const nowIso = new Date().toISOString();

  for (let index = 0; index < seedWords.length; index += 200) {
    const chunk = seedWords.slice(index, index + 200);
    await commitWrites(
      chunk.map((item) => ({
        update: {
          name: `${databasePath}/documents/words/${encodeURIComponent(item.word)}`,
          fields: Object.fromEntries(
            Object.entries({
              ...item,
              mastery: 0,
              isFavorite: false,
              source: "curated-seed-v1",
              createdAt: nowIso,
            }).map(([key, value]) => [
              key,
              key === "createdAt" ? { timestampValue: value } : toFirestoreValue(value),
            ]),
          ),
        },
      })),
      accessToken,
    );
  }

  return seedWords.length;
}

async function readLevelCounts(accessToken) {
  const documents = await listExistingWords(accessToken);
  const counts = {};

  for (const document of documents) {
    const level = document.fields?.level?.stringValue;
    if (typeof level === "string") {
      counts[level] = (counts[level] || 0) + 1;
    }
  }

  return { finalCount: documents.length, levels: counts };
}

async function main() {
  const accessToken = await getAccessToken();
  const deleted = await deleteExistingWords(accessToken);
  const inserted = await insertSeedWords(accessToken);
  const { finalCount, levels } = await readLevelCounts(accessToken);

  console.log(
    JSON.stringify(
      {
        projectId,
        deleted,
        inserted,
        finalCount,
        levels,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
