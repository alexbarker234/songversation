import Image from 'next/image'
import styles from './page.module.scss'

export default function Home() {
  return (
    <>
        <div className={styles['menu-tiles']}>
            <div className={styles['test-line']}></div>
            <div className={styles['menu-tile']}>
                test
            </div>
            <div className={styles['menu-tile']}>
                test
            </div>
            <div className={styles['menu-tile']}>
                test
            </div>
            <div className={styles['menu-tile']}>
                test
            </div>
            <div className={styles['menu-tile']}>
                test
            </div>
        </div>
    </>
  )
}
