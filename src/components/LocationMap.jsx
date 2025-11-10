import React from 'react';

const LocationMap = () => {
    // Ouled Zmam coordinates: approximately 32.5°N, 6.5°W
    // Using Google Maps embed with proper coordinates for Ouled Zmam, Morocco
    const mapUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d104857.6!2d-6.5!3d32.5!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xda3b8b8b8b8b8b8%3A0xda3b8b8b8b8b8b8!2sOuled+Zmam%2C+Morocco!5e0!3m2!1sen!2sus!4v1234567890";

    return (
        <div className="bg-gray-200 rounded-lg h-96 flex items-center justify-center overflow-hidden shadow-lg">
            <iframe
                src={mapUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Gym Location - Ouled Zmam, Morocco"
                className="rounded-lg"
            ></iframe>
        </div>
    );
};

export default LocationMap;
