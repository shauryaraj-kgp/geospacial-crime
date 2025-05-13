import React, { useState } from 'react';
import '../styles//RegionSelector.css';

export default function RegionSelector({ selectedRegion, setSelectedRegion, allRegions }) {
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState('');

    const filteredRegions = allRegions.filter(region =>
        region.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <button className="selector-button" onClick={() => setShowModal(true)}>
                {selectedRegion || "Select Region"}
            </button>

            {showModal && (
                <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <input
                            type="text"
                            placeholder="Search region..."
                            className="modal-search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <div className="modal-list">
                            {filteredRegions.map(region => (
                                <div
                                    key={region}
                                    className="modal-item"
                                    onClick={() => {
                                        setSelectedRegion(region);
                                        setShowModal(false);
                                    }}
                                >
                                    {region}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
