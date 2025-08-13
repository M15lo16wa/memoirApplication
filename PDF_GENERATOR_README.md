# Générateur de PDF - Application DMP

## Vue d'ensemble

Ce module permet de générer des documents PDF professionnels directement depuis l'interface utilisateur de l'application DMP (Dossier Médical Partagé). Il utilise les bibliothèques **jsPDF** et **html2canvas** pour créer des PDF de haute qualité.

## Fonctionnalités

### 📋 Types de documents supportés

1. **Prescriptions médicales** - PDF détaillés des ordonnances et prescriptions
2. **Fiches d'urgence** - Documents compacts avec informations vitales
3. **Historique médical complet** - Rapport détaillé de toutes les prescriptions
4. **Ordonnances** - Documents spécifiques aux traitements médicamenteux

### 🎯 Fonctionnalités clés

- ✅ Génération automatique de PDF
- ✅ Téléchargement direct des fichiers
- ✅ Impression automatique
- ✅ Templates professionnels et personnalisables
- ✅ Support des QR codes
- ✅ Mise en page responsive
- ✅ Gestion des erreurs

## Installation et dépendances

### Bibliothèques requises

```bash
npm install jspdf html2canvas
```

### Fichiers du module

- `src/services/pdfGenerator.js` - Service principal de génération
- `src/hooks/usePDFGenerator.js` - Hook React personnalisé
- `src/components/ui/PDFNotification.js` - Composant de notification

## Utilisation

### 1. Hook principal

```javascript
import { usePDFGenerator } from '../hooks/usePDFGenerator';

const MyComponent = () => {
  const {
    isGenerating,
    error,
    generatePrescriptionPDF,
    generateMedicalHistoryPDF,
    printPrescriptionPDF,
    clearError
  } = usePDFGenerator();

  // Utilisation...
};
```

### 2. Génération de PDF de prescription

```javascript
const handleGeneratePDF = async (prescription) => {
  try {
    const result = await generatePrescriptionPDF(prescription);
    if (result.success) {
      alert(`PDF généré: ${result.filename}`);
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

### 3. Génération d'historique médical

```javascript
const handleGenerateHistory = async () => {
  const patientData = {
    nom_complet: "John Doe",
    numero_dossier: "PAT-001",
    // ... autres données
  };

  const result = await generateMedicalHistoryPDF(prescriptions, patientData);
  if (result.success) {
    alert(`Historique généré: ${result.filename}`);
  }
};
```

### 4. Impression directe

```javascript
const handlePrint = async (prescription) => {
  const result = await printPrescriptionPDF(prescription);
  if (result.success) {
    alert('Impression lancée');
  }
};
```

## Templates disponibles

### Template de prescription

- En-tête avec logo de l'hôpital
- Informations du patient
- Détails de la prescription
- Informations du médecin prescripteur
- QR code (si disponible)
- Espace pour signature

### Template de fiche d'urgence

- Design d'urgence avec couleurs appropriées
- Informations personnelles vitales
- Informations médicales importantes
- Contacts d'urgence
- Instructions d'urgence

### Template d'historique médical

- Résumé des informations patient
- Statistiques des prescriptions
- Liste détaillée de toutes les prescriptions
- Classification par type et statut

## Personnalisation

### Modifier les styles

Les templates utilisent des styles inline pour garantir la compatibilité avec jsPDF. Pour modifier l'apparence :

```javascript
// Dans pdfGenerator.js
generatePrescriptionHTML(prescription) {
  return `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <!-- Votre contenu personnalisé -->
    </div>
  `;
}
```

### Ajouter de nouveaux types de documents

1. Créer une nouvelle méthode dans `PDFGenerator`
2. Ajouter la fonction correspondante dans le hook
3. Intégrer dans l'interface utilisateur

```javascript
// Nouveau type de document
async generateCustomPDF(data) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = this.generateCustomHTML(data);
  // ... configuration et génération
  return pdf;
}
```

## Gestion des erreurs

### Types d'erreurs courantes

- **Erreur de génération** : Problème lors de la création du PDF
- **Erreur de téléchargement** : Problème lors du téléchargement
- **Erreur d'impression** : Problème lors de l'impression

### Gestion dans l'interface

```javascript
const { error, clearError } = usePDFGenerator();

useEffect(() => {
  if (error) {
    // Afficher l'erreur à l'utilisateur
    alert(`Erreur: ${error}`);
    clearError();
  }
}, [error, clearError]);
```

## Performance et optimisation

### Bonnes pratiques

1. **Désactiver les boutons** pendant la génération
2. **Afficher des indicateurs de chargement**
3. **Gérer les erreurs gracieusement**
4. **Nettoyer les éléments temporaires**

### Exemple d'optimisation

```javascript
const [isGenerating, setIsGenerating] = useState(false);

const handleGenerate = async () => {
  setIsGenerating(true);
  try {
    await generatePDF();
  } finally {
    setIsGenerating(false);
  }
};

return (
  <button 
    onClick={handleGenerate}
    disabled={isGenerating}
  >
    {isGenerating ? 'Génération...' : 'Générer PDF'}
  </button>
);
```

## Intégration dans l'interface

### Boutons de téléchargement

```javascript
<button
  onClick={() => handleGeneratePrescriptionPDF(prescription)}
  disabled={isGenerating}
  className="btn btn-primary"
>
  <FaDownload className="mr-2" />
  Télécharger PDF
</button>
```

### Boutons d'impression

```javascript
<button
  onClick={() => handlePrintPrescriptionPDF(prescription)}
  disabled={isGenerating}
  className="btn btn-success"
>
  <FaPrint className="mr-2" />
  Imprimer
</button>
```

## Dépannage

### Problèmes courants

1. **PDF vide ou corrompu**
   - Vérifier que les données sont bien chargées
   - Contrôler la console pour les erreurs

2. **Erreur de génération**
   - Vérifier les dépendances installées
   - Contrôler la compatibilité navigateur

3. **Problèmes d'impression**
   - Vérifier les paramètres d'impression du navigateur
   - Contrôler les bloqueurs de popup

### Logs et débogage

```javascript
// Activer les logs détaillés
console.log('Données de prescription:', prescription);
console.log('Résultat de génération:', result);

// Vérifier les erreurs
if (error) {
  console.error('Erreur détaillée:', error);
}
```

## Support et maintenance

### Mise à jour des dépendances

```bash
npm update jspdf html2canvas
```

### Tests

Pour tester le générateur :

1. Ouvrir l'application
2. Naviguer vers la section DMP
3. Tester la génération de différents types de PDF
4. Vérifier le téléchargement et l'impression

### Support technique

En cas de problème :
1. Vérifier la console du navigateur
2. Contrôler les dépendances
3. Tester avec des données simples
4. Vérifier la compatibilité navigateur

## Licence

Ce module fait partie de l'application DMP et suit les mêmes conditions de licence.

---

**Note** : Ce générateur de PDF est optimisé pour les navigateurs modernes et nécessite JavaScript activé.
