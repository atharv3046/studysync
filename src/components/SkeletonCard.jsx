import React from 'react';

const SkeletonCard = () => (
    <div className="skeleton-card">
        <div className="skeleton-thumb" />
        <div className="skeleton-line long" />
        <div className="skeleton-line short" />
        <div className="skeleton-line medium" />
        <div className="skeleton-bar" />
        <div className="skeleton-btn" />
    </div>
);

export default SkeletonCard;
