import Image from "next/image";
import styles from "./page.module.scss";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <div className={styles["menu-tiles"]}>
        <Link className={styles["menu-tile"]} href="/game/artist">
          <div className={styles["title"]}>🎤 Artist Quiz</div>
          <div className={styles["description"]}>Guess songs from your favourite artists!</div>
        </Link>
      </div>
    </>
  );
}
