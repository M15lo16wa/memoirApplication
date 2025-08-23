/**
 * Utilitaire pour nettoyer toutes les données de test du localStorage
 * À utiliser pour éliminer les données simulées stockées localement
 */

const clearTestData = () => {
  console.log('🧹 Nettoyage des données de test du localStorage...');
  
  const keysToRemove = [];
  
  // Parcourir toutes les clés du localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      // Identifier les clés de données de test
      if (
        key.startsWith('messages_session_') ||           // Messages de démonstration
        key.startsWith('notifications_medecin_') ||      // Notifications de test
        key.startsWith('demo_') ||                       // Données de démonstration
        key.startsWith('test_') ||                       // Données de test
        key.startsWith('patients_data') ||               // Cache de patients
        key.includes('_demo') ||                         // Données de démo
        key.includes('_test') ||                         // Données de test
        key.includes('_mock')                            // Données simulées
      ) {
        keysToRemove.push(key);
      }
    }
  }
  
  // Supprimer les clés identifiées
  let removedCount = 0;
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
      removedCount++;
      console.log(`🗑️ Supprimé: ${key}`);
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression de ${key}:`, error);
    }
  });
  
  console.log(`✅ Nettoyage terminé: ${removedCount} clé(s) supprimée(s)`);
  
  return {
    success: true,
    removedCount,
    removedKeys: keysToRemove
  };
};

// Fonction pour lister les données de test sans les supprimer
const listTestData = () => {
  console.log('🔍 Liste des données de test dans localStorage:');
  
  const testKeys = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      if (
        key.startsWith('messages_session_') ||
        key.startsWith('notifications_medecin_') ||
        key.startsWith('demo_') ||
        key.startsWith('test_') ||
        key.startsWith('patients_data') ||
        key.includes('_demo') ||
        key.includes('_test') ||
        key.includes('_mock')
      ) {
        try {
          const data = localStorage.getItem(key);
          const size = data ? data.length : 0;
          testKeys.push({
            key,
            size,
            preview: data ? data.substring(0, 100) + '...' : 'empty'
          });
          console.log(`📋 ${key} (${size} chars)`);
        } catch (error) {
          console.error(`❌ Erreur lors de la lecture de ${key}:`, error);
        }
      }
    }
  }
  
  return testKeys;
};

// Fonction pour nettoyer seulement les messages de test
const clearTestMessages = () => {
  console.log('🧹 Nettoyage des messages de test uniquement...');
  
  const keysToRemove = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('messages_session_')) {
      keysToRemove.push(key);
    }
  }
  
  let removedCount = 0;
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    removedCount++;
    console.log(`🗑️ Message supprimé: ${key}`);
  });
  
  console.log(`✅ Messages nettoyés: ${removedCount} session(s) supprimée(s)`);
  
  return {
    success: true,
    removedCount,
    removedKeys: keysToRemove
  };
};

// Exporter les fonctions pour utilisation dans la console ou les composants
export { clearTestData, listTestData, clearTestMessages };

// Rendre les fonctions disponibles globalement pour debug dans la console
if (typeof window !== 'undefined') {
  window.clearTestData = clearTestData;
  window.listTestData = listTestData;
  window.clearTestMessages = clearTestMessages;
}

export default clearTestData;
