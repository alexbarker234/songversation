import React from "react";
import styles from "./modal.module.scss";

const Modal = ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) => {
    if (!isOpen) return null;

    return (
        <div className={styles["modal"]}>
            <div className={styles["modal-content"]}>{children}</div>
        </div>
    );
};

export default Modal;
