import styles from "./StatCard.module.css";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  isTextValue?: boolean;
}

export default function StatCard({title,value,icon,isTextValue}:StatCardProps) {
  return (
    <div>
      <div className={styles.card}>
        <div className={styles.icon}>{icon}</div>
        <div className={styles.content}>
            <p className={styles.title}>{title}</p>
            <p className={isTextValue ? styles.valueText :styles.value}>{value}</p>
        </div>
      </div>
    </div>
  )
}
