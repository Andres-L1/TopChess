import React from 'react';
import logoPng from '../assets/logo.png'; // Make sure this file exists!

const Logo = ({ className = "w-10 h-10" }) => {
    return (
        <img
            src={logoPng}
            alt="TopChess Logo"
            className={`${className} object-contain`}
            onError={(e) => {
                // If the user hasn't added the logo file yet, we can hide it or show a placeholder.
                // For now, let's keep it clean and just hide the broken image icon.
                // Alternatively, we could render the old SVG as fallback here.
                e.target.style.display = 'none';
            }}
        />
    );
};

export default Logo;
