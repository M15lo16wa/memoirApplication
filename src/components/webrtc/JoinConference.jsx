// src/components/webrtc/JoinConference.jsx
import React, { useState } from 'react';
import './webrtc.css';

/**
 * Composant pour rejoindre une conférence avec un lien
 * Utilisé par les patients pour rejoindre une conférence
 */
const JoinConference = ({ onJoinConference, onError }) => {
    const [conferenceLink, setConferenceLink] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!conferenceLink.trim()) {
            setError('Veuillez entrer un lien de conférence');
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // Extraire le code de conférence du lien
            let conferenceCode = '';

            // Si c'est un lien complet, extraire le code
            if (conferenceLink.includes('/conference/')) {
                const parts = conferenceLink.split('/conference/');
                conferenceCode = parts[1] || parts[0];
            } else if (conferenceLink.includes('conferenceCode=')) {
                const urlParams = new URLSearchParams(conferenceLink.split('?')[1]);
                conferenceCode = urlParams.get('conferenceCode');
            } else {
                // Si c'est juste un code, l'utiliser directement
                conferenceCode = conferenceLink.trim();
            }

            if (!conferenceCode) {
                throw new Error('Format de lien de conférence invalide');
            }

            console.log('🔗 [JoinConference] Code de conférence extrait:', conferenceCode);

            // Appeler le callback avec le code de conférence
            if (onJoinConference) {
                await onJoinConference({
                    conferenceCode: conferenceCode,
                    conferenceLink: conferenceLink
                });
            }

        } catch (error) {
            console.error('❌ [JoinConference] Erreur:', error);
            setError(error.message);
            if (onError) {
                onError(error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setConferenceLink(e.target.value);
        if (error) {
            setError(null);
        }
    };

    return (
        <div className="join-conference-modal">
            <div className="join-conference-content">
                <div className="join-conference-header">
                    <h2>Rejoindre une conférence</h2>
                    <button
                        type="button"
                        className="close-btn"
                        onClick={() => window.history.back()}
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="join-conference-form">
                    <div className="form-group">
                        <label htmlFor="conferenceLink" className="form-label">
                            Lien de conférence
                        </label>
                        <input
                            type="text"
                            id="conferenceLink"
                            value={conferenceLink}
                            onChange={handleInputChange}
                            placeholder="https://... ou code de conférence"
                            className={`form-input ${error ? 'error' : ''}`}
                            disabled={isLoading}
                        />
                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="btn btn-secondary"
                            disabled={isLoading}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isLoading || !conferenceLink.trim()}
                        >
                            {isLoading ? (
                                <>
                                    <div className="spinner"></div>
                                    Connexion...
                                </>
                            ) : (
                                'Rejoindre'
                            )}
                        </button>
                    </div>
                </form>

                <div className="join-conference-help">
                    <h3>Comment rejoindre ?</h3>
                    <ul>
                        <li>Collez le lien de conférence reçu par votre médecin</li>
                        <li>Ou entrez directement le code de conférence</li>
                        <li>Cliquez sur "Rejoindre" pour démarrer la consultation</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default JoinConference;
