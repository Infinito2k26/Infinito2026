import React from 'react';

export default function AboutPage() {
    return (
        <div style={{ padding: '4rem', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#f59e0b' }}>About Us</h1>
            <p style={{ fontSize: '1.25rem', color: '#666', maxWidth: '600px' }}>
                Infinito 2K26 is the annual sports fest of IIT Patna. We are currently finalizing the details for this year's massive celebration of athleticism and spirit. Stay tuned!
            </p>
        </div>
    );
}
