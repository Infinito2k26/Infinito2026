'use client';
import React from 'react';
import {Bot} from "lucide-react";

export default function UpcomingPage() {
    return (
        <div style={{ padding: '4rem', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#f59e0b' }}>Under Development <Bot size={50} /></h1>
            <p style={{ fontSize: '1.25rem', color: '#666', maxWidth: '600px' }}>
                We are currently finalizing the details for this year&apos;s massive celebration of athleticism and spirit. Stay tuned!
            </p>
        </div>
    );
}
