import React from 'react';

export default function EventsPage() {
    return (
        <div style={{ padding: '4rem', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#f59e0b' }}>Events</h1>
            <p style={{ fontSize: '1.25rem', color: '#666', maxWidth: '600px' }}>
                We are currently cooking up an exciting lineup of events for Infinito 2K26! Check back soon for the full schedule and details.
            </p>
        </div>
    );
}
