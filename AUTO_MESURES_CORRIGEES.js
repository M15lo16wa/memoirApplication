// 🚨 FONCTIONS AUTO-MESURES CORRIGÉES - URLs DMP
// Remplacez la section correspondante dans dmpApi.js

// Récupérer une auto-mesure spécifique par ID
export const getAutoMesureByIdDMP = async (autoMesureId) => {
    const url = `/patients/dmp/auto-mesures/${autoMesureId}`;
    console.log('🔍 getAutoMesureByIdDMP - Récupération ID:', autoMesureId);
    
    const response = await dmpApi.get(url);
    console.log('🔍 getAutoMesureByIdDMP - Réponse:', response);
    
    return response.data;
};

// Mettre à jour une auto-mesure
export const updateAutoMesureDMP = async (autoMesureId, updateData) => {
    const url = `/patients/dmp/auto-mesures/${autoMesureId}`;
    console.log('🔍 updateAutoMesureDMP - Mise à jour ID:', autoMesureId, updateData);
    
    const response = await dmpApi.put(url, updateData);
    console.log('🔍 updateAutoMesureDMP - Réponse:', response);
    
    return response.data;
};

// Supprimer une auto-mesure
export const deleteAutoMesureDMP = async (autoMesureId) => {
    const url = `/patients/dmp/auto-mesures/${autoMesureId}`;
    console.log('🔍 deleteAutoMesureDMP - Suppression ID:', autoMesureId);
    
    const response = await dmpApi.delete(url);
    console.log('🔍 deleteAutoMesureDMP - Réponse:', response);
    
    return response.data;
};

// Obtenir les statistiques des auto-mesures
export const getAutoMesuresStatsDMP = async (patientId, type = null) => {
    // ✅ Utiliser l'endpoint dédié aux statistiques
    let url = `/patients/${patientId}/dmp/auto-mesures/stats`;
    if (type) {
        url += `?type_mesure=${type}`;
    }
    
    console.log('🔍 getAutoMesuresStatsDMP - Statistiques:', patientId, type);
    
    const response = await dmpApi.get(url);
    console.log('🔍 getAutoMesuresStatsDMP - Réponse:', response);
    
    return response.data;
};

// Obtenir la dernière auto-mesure par type
export const getLastAutoMesureByTypeDMP = async (patientId, type) => {
    // ✅ Utiliser l'endpoint dédié à la dernière mesure
    const url = `/patients/${patientId}/dmp/auto-mesures/last/${type}`;
    console.log('🔍 getLastAutoMesureByTypeDMP - Dernière mesure:', patientId, type);
    
    const response = await dmpApi.get(url);
    console.log('🔍 getLastAutoMesureByTypeDMP - Réponse:', response);
    
    return response.data;
};

// ✅ TOUTES LES URLs SONT MAINTENANT CORRECTES :
// /patients/${patientId}/dmp/auto-mesures           // Liste
// /patients/dmp/auto-mesures                        // Création
// /patients/dmp/auto-mesures/${autoMesureId}        // CRUD par ID
// /patients/${patientId}/dmp/auto-mesures/stats     // Statistiques
// /patients/${patientId}/dmp/auto-mesures/last/${type} // Dernière mesure
