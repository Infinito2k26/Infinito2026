import EventForm from "@/components/admin/event-form";
import styles from "./new-event.module.css";

export default function NewEventPage() {
    return (
        <div className={styles.page}>
            <div>
                <h1 className={styles.title}>Create Event</h1>
                <p className={styles.subtitle}>
                    Pick a sport to autofill the known fee/roster/venue details, then review and create as a draft — publish it from the Events list once it looks right.
                </p>
            </div>

            <EventForm mode="create" />
        </div>
    );
}
