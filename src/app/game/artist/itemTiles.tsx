/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import styles from "./itemTiles.module.scss";
import Loading from "@/app/loading";

export default function ItemTiles({ items, isLoading }: { items: SpotifyItem[]; isLoading: boolean }) {
    if (isLoading)
        return (
            <div className={styles["items-container"]}>
                <Loading style={{ margin: "auto" }} />
            </div>
        );

    return (
        <div className={styles["items-container"]}>
            {items.length > 0 ? (
                items.map((item, index) => {
                    return (
                        <div
                            key={Math.random()}
                            className={styles["item-box"]}
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            {/* a tag works better than Link here */}
                            <a href={`/game/artist/${item.id}`}>
                                <img src={item.imageURL} alt="artist" />
                            </a>
                            <div>{item.name}</div>
                        </div>
                    );
                })
            ) : (
                <div className={styles["placeholder"]}>Search for artists!</div>
            )}
        </div>
    );
}
