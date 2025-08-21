// Script de Correction Automatisée des URLs Auto-mesures DMP
// À exécuter dans la console du navigateur ou dans Node.js

const corrections = [
    {
        search: '/patient/auto-mesures',
        replace: '/patients/dmp/auto-mesures',
        description: 'URLs des opérations CRUD par ID'
    },
    {
        search: '/patient/${patientId}/auto-mesures/stats',
        replace: '/patients/${patientId}/dmp/auto-mesures/stats',
        description: 'URL des statistiques'
    },
    {
        search: '/patient/${patientId}/auto-mesures/last',
        replace: '/patients/${patientId}/dmp/auto-mesures/last',
        description: 'URL de la dernière mesure par type'
    }
];

console.log('🔧 Script de Correction des URLs Auto-mesures DMP');
console.log('================================================');

corrections.forEach((correction, index) => {
    console.log(`${index + 1}. ${correction.description}`);
    console.log(`   Rechercher : ${correction.search}`);
    console.log(`   Remplacer par : ${correction.replace}`);
    console.log('');
});

console.log('📋 Instructions de Correction :');
console.log('1. Ouvrir src/services/api/dmpApi.js');
console.log('2. Utiliser Ctrl+H (ou Cmd+H) pour la recherche et remplacement');
console.log('3. Appliquer chaque correction une par une');
console.log('4. Vérifier que toutes les URLs commencent par /patients/ et contiennent /dmp/');
console.log('');
console.log('✅ Après correction, toutes les URLs devraient suivre ce format :');
console.log('   /patients/${patientId}/dmp/auto-mesures');
console.log('   /patients/dmp/auto-mesures');
console.log('   /patients/dmp/auto-mesures/${autoMesureId}');
console.log('   /patients/${patientId}/dmp/auto-mesures/stats');
console.log('   /patients/${patientId}/dmp/auto-mesures/last/${type}');
