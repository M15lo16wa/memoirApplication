# 📚 Exemples d'Utilisation - DMP API

## 🎯 **Vue d'Ensemble**

Ce document fournit des exemples concrets d'utilisation des nouvelles fonctionnalités DMP API pour les développeurs frontend.

---

## 🔧 **1. Demande d'Accès DMP (Médecin)**

### **Composant React : DemandeAccesForm**

```jsx
import React, { useState } from 'react';
import { requestDMPAccess, validateNewAccessRequest } from './dmpApi';

const DemandeAccesForm = ({ patientId, onSuccess, onError }) => {
    const [formData, setFormData] = useState({
        patient_id: patientId,
        type_acces: 'lecture',
        raison_demande: '',
        duree: 30
    });
    
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        
        try {
            // Validation côté client
            const validation = validateNewAccessRequest(formData);
            if (!validation.valid) {
                setErrors(validation.errors.reduce((acc, error) => {
                    // Mapping des erreurs vers les champs
                    if (error.includes('patient_id')) acc.patient_id = error;
                    if (error.includes('type_acces')) acc.type_acces = error;
                    if (error.includes('raison_demande')) acc.raison_demande = error;
                    if (error.includes('durée')) acc.duree = error;
                    return acc;
                }, {}));
                return;
            }
            
            // Envoi de la demande
            const result = await requestDMPAccess(formData);
            
            if (result.status === 'success') {
                onSuccess(result);
                // Réinitialiser le formulaire
                setFormData({
                    patient_id: patientId,
                    type_acces: 'lecture',
                    raison_demande: '',
                    duree: 30
                });
            }
        } catch (error) {
            console.error('Erreur lors de la demande d\'accès:', error);
            onError(error);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="demande-acces-form">
            <div className="form-group">
                <label htmlFor="type_acces">Type d'accès *</label>
                <select
                    id="type_acces"
                    value={formData.type_acces}
                    onChange={(e) => setFormData({...formData, type_acces: e.target.value})}
                    className={errors.type_acces ? 'error' : ''}
                >
                    <option value="lecture">Lecture seule</option>
                    <option value="ecriture">Lecture et écriture</option>
                    <option value="administration">Administration complète</option>
                </select>
                {errors.type_acces && <span className="error-message">{errors.type_acces}</span>}
            </div>
            
            <div className="form-group">
                <label htmlFor="raison_demande">Raison de la demande *</label>
                <textarea
                    id="raison_demande"
                    value={formData.raison_demande}
                    onChange={(e) => setFormData({...formData, raison_demande: e.target.value})}
                    placeholder="Décrivez la raison de votre demande d'accès (10-500 caractères)"
                    rows={4}
                    className={errors.raison_demande ? 'error' : ''}
                />
                <div className="char-count">
                    {formData.raison_demande.length}/500 caractères
                </div>
                {errors.raison_demande && <span className="error-message">{errors.raison_demande}</span>}
            </div>
            
            <div className="form-group">
                <label htmlFor="duree">Durée d'accès (minutes) *</label>
                <input
                    type="number"
                    id="duree"
                    value={formData.duree}
                    onChange={(e) => setFormData({...formData, duree: parseInt(e.target.value)})}
                    min="1"
                    max="1440"
                    className={errors.duree ? 'error' : ''}
                />
                <small>Entre 1 et 1440 minutes (24h max)</small>
                {errors.duree && <span className="error-message">{errors.duree}</span>}
            </div>
            
            <button type="submit" disabled={loading}>
                {loading ? 'Envoi en cours...' : 'Demander l\'accès'}
            </button>
        </form>
    );
};

export default DemandeAccesForm;
```

---

## 👤 **2. Gestion des Autorisations (Patient)**

### **Composant React : AutorisationsList**

```jsx
import React, { useState, useEffect } from 'react';
import { getAutorisations, accepterAutorisation, refuserAutorisation } from './dmpApi';

const AutorisationsList = () => {
    const [autorisations, setAutorisations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        loadAutorisations();
    }, []);
    
    const loadAutorisations = async () => {
        try {
            setLoading(true);
            const result = await getAutorisations();
            setAutorisations(result.data.autorisations);
        } catch (error) {
            setError('Erreur lors du chargement des autorisations');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    
    const handleAccept = async (autorisationId, commentaire) => {
        try {
            await accepterAutorisation(autorisationId, commentaire);
            // Recharger la liste
            await loadAutorisations();
            alert('Autorisation acceptée avec succès');
        } catch (error) {
            alert('Erreur lors de l\'acceptation');
            console.error(error);
        }
    };
    
    const handleRefuse = async (autorisationId, raison) => {
        if (!raison.trim()) {
            alert('Veuillez indiquer une raison de refus');
            return;
        }
        
        try {
            await refuserAutorisation(autorisationId, raison);
            // Recharger la liste
            await loadAutorisations();
            alert('Autorisation refusée');
        } catch (error) {
            alert('Erreur lors du refus');
            console.error(error);
        }
    };
    
    if (loading) return <div>Chargement des autorisations...</div>;
    if (error) return <div className="error">{error}</div>;
    
    return (
        <div className="autorisations-list">
            <h2>Demandes d'accès à votre DMP</h2>
            
            {autorisations.length === 0 ? (
                <p>Aucune demande d'accès en attente</p>
            ) : (
                autorisations.map(autorisation => (
                    <AutorisationCard
                        key={autorisation.id_acces}
                        autorisation={autorisation}
                        onAccept={handleAccept}
                        onRefuse={handleRefuse}
                    />
                ))
            )}
        </div>
    );
};

const AutorisationCard = ({ autorisation, onAccept, onRefuse }) => {
    const [commentaire, setCommentaire] = useState('');
    const [raisonRefus, setRaisonRefus] = useState('');
    const [showActions, setShowActions] = useState(false);
    
    const getStatusColor = (statut) => {
        switch (statut) {
            case 'attente_validation': return 'warning';
            case 'actif': return 'success';
            case 'refuse': return 'danger';
            case 'expire': return 'secondary';
            default: return 'info';
        }
    };
    
    const getStatusText = (statut) => {
        switch (statut) {
            case 'attente_validation': return 'En attente de validation';
            case 'actif': return 'Accès actif';
            case 'refuse': return 'Accès refusé';
            case 'expire': return 'Accès expiré';
            default: return statut;
        }
    };
    
    return (
        <div className={`autorisation-card ${getStatusColor(autorisation.statut)}`}>
            <div className="header">
                <h3>
                    Dr. {autorisation.professionnel.nom} {autorisation.professionnel.prenom}
                </h3>
                <span className={`status-badge ${getStatusColor(autorisation.statut)}`}>
                    {getStatusText(autorisation.statut)}
                </span>
            </div>
            
            <div className="details">
                <p><strong>Spécialité :</strong> {autorisation.professionnel.specialite}</p>
                <p><strong>Type d'accès :</strong> {autorisation.type_acces}</p>
                <p><strong>Raison :</strong> {autorisation.raison_demande}</p>
                <p><strong>Durée demandée :</strong> {autorisation.conditions_acces.duree_demandee} minutes</p>
                <p><strong>Date de demande :</strong> {new Date(autorisation.date_creation).toLocaleString()}</p>
            </div>
            
            {autorisation.statut === 'attente_validation' && (
                <div className="actions">
                    <button 
                        onClick={() => setShowActions(!showActions)}
                        className="btn-toggle"
                    >
                        {showActions ? 'Masquer' : 'Afficher'} les actions
                    </button>
                    
                    {showActions && (
                        <div className="action-buttons">
                            <div className="action-group">
                                <h4>Accepter l'accès</h4>
                                <textarea
                                    placeholder="Commentaire optionnel"
                                    value={commentaire}
                                    onChange={(e) => setCommentaire(e.target.value)}
                                    rows={2}
                                />
                                <button 
                                    onClick={() => onAccept(autorisation.id_acces, commentaire)}
                                    className="btn-accept"
                                >
                                    ✅ Accepter
                                </button>
                            </div>
                            
                            <div className="action-group">
                                <h4>Refuser l'accès</h4>
                                <textarea
                                    placeholder="Raison du refus (obligatoire)"
                                    value={raisonRefus}
                                    onChange={(e) => setRaisonRefus(e.target.value)}
                                    rows={2}
                                    required
                                />
                                <button 
                                    onClick={() => onRefuse(autorisation.id_acces, raisonRefus)}
                                    className="btn-refuse"
                                    disabled={!raisonRefus.trim()}
                                >
                                    ❌ Refuser
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AutorisationsList;
```

---

## 👨‍⚕️ **3. Suivi des Demandes (Médecin)**

### **Composant React : AutorisationsDemandees**

```jsx
import React, { useState, useEffect } from 'react';
import { getAutorisationsDemandees, verifierAcces, getDureeRestante } from './dmpApi';

const AutorisationsDemandees = () => {
    const [autorisations, setAutorisations] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        loadAutorisations();
    }, []);
    
    const loadAutorisations = async () => {
        try {
            setLoading(true);
            const result = await getAutorisationsDemandees();
            setAutorisations(result.data.autorisations);
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const checkAccess = async (patientId) => {
        try {
            const result = await verifierAcces(1, patientId); // ID médecin = 1
            if (result.data.acces_autorise) {
                alert('Accès autorisé et actif');
            } else {
                alert('Accès non autorisé ou expiré');
            }
        } catch (error) {
            alert('Erreur lors de la vérification');
            console.error(error);
        }
    };
    
    const checkRemainingTime = async (autorisationId) => {
        try {
            const result = await getDureeRestante(autorisationId);
            alert(`Durée restante : ${result.data.duree_restante} minutes`);
        } catch (error) {
            alert('Erreur lors de la vérification de la durée');
            console.error(error);
        }
    };
    
    if (loading) return <div>Chargement...</div>;
    
    return (
        <div className="autorisations-demandees">
            <h2>Mes demandes d'accès DMP</h2>
            
            {autorisations.length === 0 ? (
                <p>Aucune demande d'accès envoyée</p>
            ) : (
                autorisations.map(autorisation => (
                    <DemandeCard
                        key={autorisation.id_acces}
                        autorisation={autorisation}
                        onCheckAccess={() => checkAccess(autorisation.patient_id)}
                        onCheckTime={() => checkRemainingTime(autorisation.id_acces)}
                    />
                ))
            )}
        </div>
    );
};

const DemandeCard = ({ autorisation, onCheckAccess, onCheckTime }) => {
    const getStatusIcon = (statut) => {
        switch (statut) {
            case 'attente_validation': return '⏳';
            case 'actif': return '✅';
            case 'refuse': return '❌';
            case 'expire': return '⏰';
            default: return '❓';
        }
    };
    
    return (
        <div className={`demande-card ${autorisation.statut}`}>
            <div className="header">
                <span className="status-icon">{getStatusIcon(autorisation.statut)}</span>
                <h3>Patient #{autorisation.patient_id}</h3>
                <span className="status">{autorisation.statut}</span>
            </div>
            
            <div className="details">
                <p><strong>Type d'accès :</strong> {autorisation.type_acces}</p>
                <p><strong>Raison :</strong> {autorisation.raison_demande}</p>
                <p><strong>Durée demandée :</strong> {autorisation.conditions_acces.duree_demandee} minutes</p>
                <p><strong>Date de demande :</strong> {new Date(autorisation.date_creation).toLocaleString()}</p>
                
                {autorisation.date_debut && (
                    <p><strong>Début d'accès :</strong> {new Date(autorisation.date_debut).toLocaleString()}</p>
                )}
                
                {autorisation.date_fin && (
                    <p><strong>Fin d'accès :</strong> {new Date(autorisation.date_fin).toLocaleString()}</p>
                )}
                
                {autorisation.raison_refus && (
                    <p><strong>Raison du refus :</strong> {autorisation.raison_refus}</p>
                )}
            </div>
            
            <div className="actions">
                {autorisation.statut === 'actif' && (
                    <>
                        <button onClick={onCheckAccess} className="btn-check">
                            Vérifier l'accès
                        </button>
                        <button onClick={onCheckTime} className="btn-time">
                            Durée restante
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default AutorisationsDemandees;
```

---

## 🎨 **4. Styles CSS Recommandés**

```css
/* Styles pour les formulaires et cartes */
.demande-acces-form {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
}

.form-group input,
.form-group select,
.form-group textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
}

.form-group input.error,
.form-group select.error,
.form-group textarea.error {
    border-color: #dc3545;
}

.error-message {
    color: #dc3545;
    font-size: 12px;
    margin-top: 5px;
}

.char-count {
    font-size: 12px;
    color: #666;
    text-align: right;
    margin-top: 5px;
}

/* Styles pour les cartes d'autorisation */
.autorisation-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
    background: white;
}

.autorisation-card.warning {
    border-left: 4px solid #ffc107;
}

.autorisation-card.success {
    border-left: 4px solid #28a745;
}

.autorisation-card.danger {
    border-left: 4px solid #dc3545;
}

.autorisation-card.secondary {
    border-left: 4px solid #6c757d;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.status-badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
}

.status-badge.warning {
    background: #fff3cd;
    color: #856404;
}

.status-badge.success {
    background: #d4edda;
    color: #155724;
}

.status-badge.danger {
    background: #f8d7da;
    color: #721c24;
}

.status-badge.secondary {
    background: #e2e3e5;
    color: #383d41;
}

.details p {
    margin: 5px 0;
}

.actions {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #eee;
}

.action-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-top: 10px;
}

.action-group {
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #f8f9fa;
}

.action-group h4 {
    margin: 0 0 10px 0;
    font-size: 14px;
}

.btn-accept {
    background: #28a745;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
}

.btn-refuse {
    background: #dc3545;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
}

.btn-refuse:disabled {
    background: #6c757d;
    cursor: not-allowed;
}

.btn-toggle {
    background: #007bff;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
}
```

---

## 🧪 **5. Tests d'Intégration**

```javascript
// Test d'intégration complet
const testIntegrationComplete = async () => {
    console.log('🧪 Test d\'intégration DMP API');
    
    try {
        // 1. Demande d'accès
        const demandeData = {
            patient_id: 1,
            type_acces: 'lecture',
            raison_demande: 'Test d\'intégration - Consultation d\'urgence',
            duree: 30
        };
        
        console.log('1. Validation des données...');
        const validation = validateNewAccessRequest(demandeData);
        if (!validation.valid) {
            throw new Error(`Validation échouée: ${validation.errors.join(', ')}`);
        }
        
        console.log('2. Envoi de la demande d\'accès...');
        const demandeResult = await requestDMPAccess(demandeData);
        console.log('✅ Demande créée:', demandeResult);
        
        // 3. Récupération des autorisations (côté patient)
        console.log('3. Récupération des autorisations...');
        const autorisations = await getAutorisations();
        console.log('✅ Autorisations récupérées:', autorisations);
        
        // 4. Acceptation de l'autorisation
        if (autorisations.data.autorisations.length > 0) {
            const autorisation = autorisations.data.autorisations[0];
            console.log('4. Acceptation de l\'autorisation...');
            const acceptResult = await accepterAutorisation(autorisation.id_acces, 'Test d\'intégration');
            console.log('✅ Autorisation acceptée:', acceptResult);
            
            // 5. Vérification d'accès
            console.log('5. Vérification d\'accès...');
            const verifResult = await verifierAcces(1, demandeData.patient_id);
            console.log('✅ Vérification d\'accès:', verifResult);
            
            // 6. Durée restante
            console.log('6. Vérification de la durée restante...');
            const dureeResult = await getDureeRestante(autorisation.id_acces);
            console.log('✅ Durée restante:', dureeResult);
        }
        
        console.log('🎉 Test d\'intégration réussi !');
        
    } catch (error) {
        console.error('❌ Erreur lors du test d\'intégration:', error);
    }
};

// Exécuter le test
// testIntegrationComplete();
```

---

## 📊 **6. Métriques et Monitoring**

```javascript
// Fonction de monitoring des performances
const monitorDMPPerformance = () => {
    const metrics = {
        requests: 0,
        errors: 0,
        avgResponseTime: 0,
        startTime: Date.now()
    };
    
    // Wrapper pour mesurer les performances
    const measurePerformance = async (apiCall, name) => {
        const start = Date.now();
        metrics.requests++;
        
        try {
            const result = await apiCall();
            const duration = Date.now() - start;
            metrics.avgResponseTime = (metrics.avgResponseTime + duration) / metrics.requests;
            
            console.log(`✅ ${name} - ${duration}ms`);
            return result;
        } catch (error) {
            metrics.errors++;
            console.error(`❌ ${name} - Erreur:`, error);
            throw error;
        }
    };
    
    // Exemple d'utilisation
    const testWithMonitoring = async () => {
        await measurePerformance(
            () => requestDMPAccess({
                patient_id: 1,
                type_acces: 'lecture',
                raison_demande: 'Test de performance',
                duree: 30
            }),
            'Demande d\'accès'
        );
        
        await measurePerformance(
            () => getAutorisations(),
            'Récupération autorisations'
        );
        
        console.log('📊 Métriques:', metrics);
    };
    
    return { measurePerformance, metrics };
};
```

---

**🎯 Conclusion :** Ces exemples fournissent une base solide pour implémenter les nouvelles fonctionnalités DMP dans votre application frontend. Adaptez-les selon vos besoins spécifiques et votre architecture existante.
