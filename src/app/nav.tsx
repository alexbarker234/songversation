/* eslint-disable @next/next/no-img-element */

"use client";
import { useState } from "react";
import styles from "./nav.module.scss";
import Link from "next/link";

export default function Nav({ userData }: { userData?: UserData }) {
  const [isNavOpen, setNavOpen] = useState(false);
  return (
    <>
      <nav className={styles["top-nav"]}>
        <Link className={styles["logo"]} href="/">
          songversation.
        </Link>
        {/* {userData ? (
                    <div className={styles["nav-left"]}>
                        <div className={styles["profile-dropdown"]} onClick={() => setNavOpen(!isNavOpen)}>
                            <img className={styles["profile-image"]} src={`${userData}`} alt="pfp" />
                            <div className={styles["hide-on-mobile"]}>
                                {userData.name}
                                <i className={styles["fa fa-caret-down"]}></i>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={styles["nav-left"]}>
                        <Link href="#">
                            <div className={styles["nav-login"]}>Log in</div>
                        </Link>
                    </div>
                )} */}
      </nav>
      {userData && (
        <div className={`${styles["side-nav"]} ${!isNavOpen && styles["disabled"]}`} id="side-nav">
          <Link href="#" className={styles["nav-item"]}>
            <i className={styles["fas fa-user-friends"]}></i>Friends
          </Link>
          <Link href="#" className={styles["nav-item"]}>
            <i className={styles["fa fa-chart-simple"]}></i>Statistics
          </Link>
          <Link href="#" className={styles["nav-item"]}>
            <i className={styles["fa fa-sign-out"]}></i>Sign Out
          </Link>
        </div>
      )}
    </>
  );
}
