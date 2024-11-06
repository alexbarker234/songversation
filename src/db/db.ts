import Dexie, { type EntityTable } from "dexie";

const db = new Dexie("SongversationDB") as Dexie & {
  tracks: EntityTable<Track, "id">;
  gameItems: EntityTable<GameItem, "id">;
};

db.version(1).stores({
  tracks: "++id",
  gameItems: "++id"
});

export { db };
