import React from 'react';

import PublicLayout from '@/components/layout/public-layout';

import styles from '../privacy-policy/privacy-policy.module.css';

export default function TermsAndConditionsPage() {
    return (
        <PublicLayout>
            <div className={styles.pageWrapper}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Terms &amp; Registration Policy</h1>
                    <p className={styles.updated}>Infinito 2K26 — IIT Patna</p>
                </div>
                <div className={styles.content}>
                    <h2>Registration</h2>
                    <p>
                        By registering for an event, you confirm that the details you provide (name, email,
                        college, gender where required, and team roster for team events) are accurate. Some
                        events have team size limits and eligibility rules (such as IITP-only or open categories)
                        shown on the event page — registrations that don&apos;t meet them may be rejected.
                    </p>

                    <h2>Payment</h2>
                    <p>
                        Payment is collected by UPI transfer to the details shown at checkout. After paying, you
                        submit a screenshot and transaction ID as proof; an organizer manually verifies this
                        against the amount due. Your registration is confirmed only once payment is verified —
                        until then it stays in a pending state.
                    </p>
                    <p>
                        If your payment proof is rejected (for example, a mismatched amount or an unreadable
                        screenshot), you will see the reason on your dashboard and can resubmit valid proof.
                    </p>

                    <h2>Cancellations &amp; refunds</h2>
                    <ul>
                        <li>
                            Once a payment is verified as successful, the registration fee is non-refundable,
                            except where an event is cancelled or postponed indefinitely by the organizers — in
                            that case, registrants will be offered a full refund or the option to transfer to a
                            rescheduled date.
                        </li>
                        <li>
                            If your payment proof is rejected, no fee has actually been captured on our side — any
                            money debited from your account is a matter between you and the recipient UPI
                            handle, and should be raised with your bank/UPI app if it doesn&apos;t reverse
                            automatically.
                        </li>
                        <li>
                            Withdrawing from an event after confirmation does not entitle you to a refund, unless
                            required by applicable law.
                        </li>
                    </ul>

                    <h2>Capacity &amp; waitlists</h2>
                    <p>
                        Events with a capacity limit stop accepting new registrations once full. Confirmed
                        registrations are honored on a first-verified-payment basis.
                    </p>

                    <h2>Conduct</h2>
                    <p>
                        Participants and team members are expected to follow the venue&apos;s and organizers&apos;
                        instructions on fest day, including at gate check-in. Entry may be refused without a
                        valid QR credential or accepted photo ID.
                    </p>

                    <p>
                        Questions about a specific registration or payment can be directed to the Infinito 2K26
                        organizing team through the contact channels published on the fest&apos;s official pages.
                    </p>
                </div>
            </div>
        </PublicLayout>
    );
}
