# 📋 Guide d'utilisation des consultations dans l'historique médical

## 🎯 Fonctions disponibles dans `dmpApi.js`

### 1. **`getConsultationsHistoriqueMedical(patientId)`**
Récupère toutes les consultations d'un patient via l'API des consultations.

```javascript
import dmpApi from '../services/api/dmpApi';

// Récupérer les consultations du patient connecté
const consultations = await dmpApi.getConsultationsHistoriqueMedical();

// Récupérer les consultations d'un patient spécifique
const consultationsPatient = await dmpApi.getConsultationsHistoriqueMedical(123);

console.log('Consultations trouvées:', consultations.data);
console.log('Nombre de consultations:', consultations.count);
console.log('Statut:', consultations.status);
```

### 2. **`getConsultationsByPeriod(patientId, dateDebut, dateFin)`**
Récupère les consultations d'un patient sur une période spécifique.

```javascript
// Récupérer les consultations du mois dernier
const dateDebut = '2025-07-01';
const dateFin = '2025-07-31';
const consultationsPeriode = await dmpApi.getConsultationsByPeriod(123, dateDebut, dateFin);

console.log('Consultations de la période:', consultationsPeriode.data);
console.log('Période:', consultationsPeriode.periode);
```

### 3. **`getConsultationsByType(patientId, typeConsultation)`**
Récupère les consultations d'un patient par type.

```javascript
// Récupérer les consultations de routine
const consultationsRoutine = await dmpApi.getConsultationsByType(123, 'routine');

// Récupérer les consultations d'urgence
const consultationsUrgence = await dmpApi.getConsultationsByType(123, 'urgence');

console.log('Consultations de routine:', consultationsRoutine.data);
console.log('Type recherché:', consultationsRoutine.type);
```

## 🔧 Utilisation dans un composant React

```javascript
import React, { useState, useEffect } from 'react';
import dmpApi from '../services/api/dmpApi';

const HistoriqueConsultations = ({ patientId }) => {
    const [consultations, setConsultations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Charger toutes les consultations
    const chargerConsultations = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const resultat = await dmpApi.getConsultationsHistoriqueMedical(patientId);
            
            if (resultat.status === 'success' || resultat.status === 'success_fallback') {
                setConsultations(resultat.data);
            } else {
                setError(resultat.message || 'Erreur lors du chargement');
            }
        } catch (err) {
            setError('Erreur de connexion au serveur');
            console.error('Erreur:', err);
        } finally {
            setLoading(false);
        }
    };

    // Charger les consultations au montage du composant
    useEffect(() => {
        if (patientId) {
            chargerConsultations();
        }
    }, [patientId]);

    // Filtrer par période
    const filtrerParPeriode = async (debut, fin) => {
        try {
            setLoading(true);
            const resultat = await dmpApi.getConsultationsByPeriod(patientId, debut, fin);
            
            if (resultat.status === 'success') {
                setConsultations(resultat.data);
            } else {
                setError(resultat.message);
            }
        } catch (err) {
            setError('Erreur lors du filtrage');
        } finally {
            setLoading(false);
        }
    };

    // Filtrer par type
    const filtrerParType = async (type) => {
        try {
            setLoading(true);
            const resultat = await dmpApi.getConsultationsByType(patientId, type);
            
            if (resultat.status === 'success') {
                setConsultations(resultat.data);
            } else {
                setError(resultat.message);
            }
        } catch (err) {
            setError('Erreur lors du filtrage');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Chargement des consultations...</div>;
    if (error) return <div>Erreur: {error}</div>;

    return (
        <div className="historique-consultations">
            <h2>Historique des consultations</h2>
            
            {/* Filtres */}
            <div className="filtres">
                <button onClick={() => filtrerParPeriode('2025-01-01', '2025-12-31')}>
                    Toutes les consultations 2025
                </button>
                <button onClick={() => filtrerParType('routine')}>
                    Consultations de routine
                </button>
                <button onClick={() => filtrerParType('urgence')}>
                    Consultations d'urgence
                </button>
                <button onClick={chargerConsultations}>
                    Toutes les consultations
                </button>
            </div>

            {/* Liste des consultations */}
            <div className="liste-consultations">
                {consultations.length === 0 ? (
                    <p>Aucune consultation trouvée</p>
                ) : (
                    consultations.map((consultation, index) => (
                        <div key={index} className="consultation-item">
                            <h3>Consultation du {new Date(consultation.date).toLocaleDateString()}</h3>
                            <p><strong>Motif:</strong> {consultation.motif}</p>
                            <p><strong>Observations:</strong> {consultation.observations}</p>
                            <p><strong>Statut:</strong> {consultation.statut}</p>
                            {consultation.professionnel && (
                                <p><strong>Professionnel:</strong> {consultation.professionnel}</p>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default HistoriqueConsultations;
```

## 📊 Structure des données retournées

### Réponse de `getConsultationsHistoriqueMedical`

```javascript
{
    data: [
        {
            id: 1,
            type: 'consultation',
            date: '2025-08-26T10:00:00Z',
            statut: 'terminee',
            motif: 'Consultation de routine',
            observations: 'Patient en bonne santé générale',
            professionnel: 'Dr. Martin',
            service: 'Médecine générale'
        }
        // ... autres consultations
    ],
    status: 'success',
    count: 5,
    patientId: 123
}
```

### Réponse de `getConsultationsByPeriod`

```javascript
{
    data: [...], // consultations filtrées
    status: 'success',
    count: 3,
    periode: {
        debut: '2025-07-01',
        fin: '2025-07-31'
    }
}
```

### Réponse de `getConsultationsByType`

```javascript
{
    data: [...], // consultations filtrées
    status: 'success',
    count: 2,
    type: 'routine'
}
```

## 🚀 Fonctionnalités avancées

### Gestion des erreurs

Les fonctions gèrent automatiquement les cas d'erreur :

1. **Récupération directe** : Utilise l'API des consultations `/consultation/patient/${patientId}`
2. **Gestion d'erreur** : Retour d'un objet structuré avec statut et message
3. **Enrichissement des données** : Normalisation automatique des champs

### Enrichissement automatique des données

Les consultations sont automatiquement enrichies avec des champs par défaut :
- `type` → 'consultation'
- `statut` → 'terminee'
- `motif` → 'Consultation médicale'
- `observations` → ''

### Filtrage intelligent

Les fonctions de filtrage gèrent automatiquement :
- Les formats de date variés
- Les différents noms de champs
- Les cas où aucune donnée n'est disponible

## 🔗 Intégration avec d'autres services

Ces fonctions s'intègrent parfaitement avec :
- `getPatientConsultations()` - **Fonction principale** utilisée en interne
- `getHistoriqueMedical()` - Pour l'historique complet
- `getDMP()` - Pour le dossier médical complet
- `getTableauDeBord()` - Pour un aperçu global

## 📍 **Chemin API utilisé**

Toutes les fonctions utilisent le chemin défini dans `getPatientConsultations()` :
```
GET /api/consultation/patient/${patientId}
```
