'use client';

import React from 'react';

import Card from '@/components/ui/card';

import styles from './privacy-policy.module.css';

export default function PrivacyPolicyPage() {
    return (
        <div className={styles.pageWrapper}>
            <Card className={styles.privacyPolicyCard}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Privacy Policy</h1>
                    <p className={styles.updated}>Infinito 2K26 — IIT Patna</p>
                </div>
                <div className={styles.content}>
                    <p>
                        This policy explains what information Infinito 2K26 collects when you register for an
                        event, form a team, or apply as a Campus Ambassador, and how that information is used.
                    </p>

                    <h2>What we collect</h2>
                    <ul>
                        <li>Account details: name, email address, phone number, and college.</li>
                        <li>
                            Registration details: the event(s) and sub-events you sign up for, team roster and
                            captain information, gender (where an event&apos;s fee depends on it), and any
                            accommodation or mess-only add-ons you select.
                        </li>
                        <li>
                            Payment verification details: the UPI transaction ID and payment screenshot you
                            submit, used solely to confirm your payment. We do not process or store your UPI PIN,
                            bank credentials, or card details — payments are made directly between you and the
                            event organizers over UPI.
                        </li>
                        <li>
                            Check-in data: your QR credential and the gate scan log created when it is used to
                            enter or exit the venue.
                        </li>
                        <li>
                            Campus Ambassador data (if you apply or are referred): your application, task
                            submissions, and referral activity.
                        </li>
                    </ul>

                    <h2>How we use it</h2>
                    <ul>
                        <li>To process your registration and confirm your payment.</li>
                        <li>To issue and validate your QR entry credential on fest day.</li>
                        <li>To run the Campus Ambassador referral and task program, where applicable.</li>
                        <li>To contact you about your registration, event updates, or payment status.</li>
                    </ul>

                    <h2>Who else sees it</h2>
                    <p>
                        Payment screenshots are stored with Cloudinary via access-controlled, time-limited links —
                        not publicly accessible. Your data is visible to the Infinito organizing team and
                        volunteers for the purposes above, and is not sold or shared with third parties for
                        advertising.
                    </p>

                    <h2>Your choices</h2>
                    <p>
                        You can request a copy of the data we hold about you, ask us to correct it, or ask us to
                        delete your account after the fest concludes, by contacting the organizing team.
                    </p>

                    <p>
                        Questions about this policy can be directed to the Infinito 2K26 organizing team through
                        the contact channels published on the fest&apos;s official pages.
                    </p>
                </div>
            </Card>
        </div>
    );
}
