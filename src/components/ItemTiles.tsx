import Loading from "@/app/loading";
import { SpotifyItem } from "@/types";

export default function ItemTiles({ items, isLoading }: { items: SpotifyItem[]; isLoading: boolean }) {
  if (isLoading)
    return (
      <div className="mt-4 flex w-full justify-center">
        <Loading style={{ margin: "auto" }} />
      </div>
    );

  return (
    <div className="mb-20 mt-4 flex w-full flex-wrap content-center justify-center gap-4 md:mb-0 md:grid md:grid-cols-[repeat(auto-fit,_minmax(13rem,_2fr))]">
      {items.length > 0 &&
        items.map((item, index) => (
          <div
            key={item.id}
            className="h-68 relative flex w-48 animate-fade-drop-in flex-col items-center overflow-hidden opacity-0 transition-opacity duration-200"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <a href={`/game/artist/${item.id}`}>
              <img
                src={item.imageURL}
                alt="artist"
                className="block h-48 w-48 cursor-pointer bg-pink-300 object-cover transition-opacity duration-200 hover:opacity-50"
              />
            </a>
            <div className="mt-2 text-center">{item.name}</div>
          </div>
        ))}
    </div>
  );
}
