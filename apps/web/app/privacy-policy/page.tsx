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
                </div>
                <div className={styles.content}>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                </div>
            </Card>
        </div>
    );
}