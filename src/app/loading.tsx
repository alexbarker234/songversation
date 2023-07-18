

import { CSSProperties } from "react";
import styles from "./loading.module.scss";

interface LoadingProp {
    style?: CSSProperties;
}

export default function Loading({style} : LoadingProp) {
    return (
        <div className={styles['loader']} style={style}>
            <span/>
            <span/>
            <span/>
        </div>
    );
}