import React, { useState, useEffect } from 'react';
import { useDMP } from '../../hooks/useDMP';
import { FaUpload, FaFileMedical, FaHeartbeat, FaTrash, FaEye, FaDownload, FaPlus } from 'react-icons/fa';

const DMPMonEspaceSante = () => {
    const { 
        autoMesures, 
        documents,
        loading, 
        error,
        loadAutoMesures,
        loadDocuments,
        uploadDocument,
        createAutoMesure
    } = useDMP();

    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showAutoMesureModal, setShowAutoMesureModal] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [uploadData, setUploadData] = useState({
        file: null,
        type: 'general',
        description: '',
        categorie: 'general'
    });
    
    // États pour les filtres de documents
    const [documentFilters, setDocumentFilters] = useState({
        type: '',
        date_debut: '',
        date_fin: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const [autoMesureData, setAutoMesureData] = useState({
        type: 'poids',
        valeur: '',
        valeur_secondaire: '',
        unite: '',
        unite_secondaire: '',
        date_mesure: new Date().toISOString().split('T')[0],
        heure_mesure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        notes: ''
    });

    useEffect(() => {
        // Charger les documents et auto-mesures au montage du composant
        loadDocuments();
        loadAutoMesures();
    }, [loadDocuments, loadAutoMesures]);

    // Fonctions pour gérer les filtres de documents
    const handleFilterChange = (field, value) => {
        setDocumentFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const applyFilters = () => {
        // Nettoyer les filtres vides
        const cleanFilters = Object.fromEntries(
            Object.entries(documentFilters).filter(([key, value]) => value !== '' && value !== null)
        );
        loadDocuments(cleanFilters);
    };

    const clearFilters = () => {
        setDocumentFilters({
            type: '',
            date_debut: '',
            date_fin: ''
        });
        loadDocuments({}); // Recharger sans filtres
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setUploadData(prev => ({ ...prev, file }));
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!uploadData.file) return;

        // Debug: Vérifier les données avant l'appel
        console.log('📁 Données uploadData avant appel à uploadDocument:', {
            file: {
                name: uploadData.file?.name,
                type: uploadData.file?.type,
                size: uploadData.file?.size,
                isFile: uploadData.file instanceof File
            },
            type: uploadData.type,
            description: uploadData.description,
            categorie: uploadData.categorie
        });

        try {
            await uploadDocument(uploadData);
            setShowUploadModal(false);
            setUploadData({
                file: null,
                type: 'general',
                description: '',
                categorie: 'general'
            });
            loadDocuments({}); // Recharger les documents via le contexte
        } catch (error) {
            console.error('Erreur lors de l\'upload:', error);
        }
    };

    const handleAutoMesureSubmit = async (e) => {
        e.preventDefault();
        
        try {
            await createAutoMesure(autoMesureData);
            setShowAutoMesureModal(false);
            setAutoMesureData({
                type: 'poids',
                valeur: '',
                valeur_secondaire: '',
                unite: '',
                unite_secondaire: '',
                date_mesure: new Date().toISOString().split('T')[0],
                heure_mesure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                notes: ''
            });
            loadAutoMesures(); // Recharger les auto-mesures
        } catch (error) {
            console.error('Erreur lors de la création de l\'auto-mesure:', error);
        }
    };

    const getMesureConfig = (type) => {
        const configs = {
            poids: { label: 'Poids', icon: 'FaWeight', color: 'text-blue-500', bgColor: 'bg-blue-100', unite: 'kg', placeholder: 'Ex: 75', min: 20, max: 300, step: 0.1, description: 'Votre poids en kilogrammes' },
            taille: { label: 'Taille', icon: 'FaUser', color: 'text-green-500', bgColor: 'bg-green-100', unite: 'cm', placeholder: 'Ex: 175', min: 50, max: 250, step: 0.5, description: 'Votre taille en centimètres' },
            tension_arterielle: { label: 'Tension artérielle', icon: 'FaHeartbeat', color: 'text-red-500', bgColor: 'bg-red-100', unite: 'mmHg', placeholder_systolique: 'Ex: 120', placeholder_diastolique: 'Ex: 80', min: 50, max: 300, step: 1, description: 'Votre tension artérielle (systolique/diastolique)', hasSecondValue: true },
            glycemie: { label: 'Glycémie', icon: 'FaTint', color: 'text-purple-500', bgColor: 'bg-purple-100', unite: 'mg/dL', placeholder: 'Ex: 95', min: 20, max: 600, step: 1, description: 'Votre taux de glycémie' },
            temperature: { label: 'Température', icon: 'FaThermometerHalf', color: 'text-orange-500', bgColor: 'bg-orange-100', unite: '°C', placeholder: 'Ex: 36.8', min: 30, max: 45, step: 0.1, description: 'Votre température corporelle' },
            saturation: { label: 'Saturation O2', icon: 'FaHeartbeat', color: 'text-cyan-500', bgColor: 'bg-cyan-100', unite: '%', placeholder: 'Ex: 98', min: 70, max: 100, step: 1, description: 'Votre saturation en oxygène' }
        };
        return configs[type] || configs.poids;
    };

    const handleTypeMesureChange = (newType) => {
        const config = getMesureConfig(newType);
        setAutoMesureData(prev => ({
            ...prev,
            type: newType,
            unite: config.unite,
            unite_secondaire: config.hasSecondValue ? config.unite : ''
        }));
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <strong>Attention:</strong> {error}
                </div>
                {/* Afficher les données même en cas d'erreur */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Mes Documents</h2>
                    <div className="space-y-3">
                        {documents && documents.length > 0 ? (
                            documents.map((doc, index) => (
                                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center mr-3">
                                                <FaFileMedical className="text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{doc.nom}</p>
                                                <p className="text-sm text-gray-600">{doc.type}</p>
                                                <p className="text-xs text-gray-500">
                                                    {doc.taille ? formatFileSize(doc.taille) : 'Taille inconnue'} • {doc.createdAt ? formatDate(doc.createdAt) : 'Date inconnue'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => setSelectedDocument(doc)}
                                                className="text-blue-500 hover:text-blue-700"
                                            >
                                                <FaEye />
                                            </button>
                                            <button className="text-green-500 hover:text-green-700">
                                                <FaDownload />
                                            </button>
                                            <button className="text-red-500 hover:text-red-700">
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-8">Aucun document disponible</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-6 rounded-lg">
                <h1 className="text-2xl font-bold">Mon Espace de Santé</h1>
                <p className="text-green-100">
                    Gérez vos documents personnels et vos auto-mesures
                </p>
            </div>

            {/* Boutons d'action */}
            <div className="flex flex-wrap gap-4">
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
                >
                    <FaUpload className="mr-2" />
                    Uploader un document
                </button>
                <button
                    onClick={() => setShowAutoMesureModal(true)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center"
                >
                    <FaPlus className="mr-2" />
                    Nouvelle auto-mesure
                </button>
            </div>

            {/* Contenu en 2 colonnes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Documents */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold flex items-center">
                            <FaFileMedical className="text-blue-500 mr-2" />
                            Mes Documents
                        </h2>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
                        </button>
                    </div>
                    
                    {/* Interface de filtres */}
                    {showFilters && (
                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                            <h3 className="font-medium mb-3">Filtres de recherche</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Type de document
                                    </label>
                                    <select
                                        value={documentFilters.type}
                                        onChange={(e) => handleFilterChange('type', e.target.value)}
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                    >
                                        <option value="">Tous les types</option>
                                        <option value="ordonnance">Ordonnance</option>
                                        <option value="resultat">Résultat d'examen</option>
                                        <option value="certificat">Certificat médical</option>
                                        <option value="general">Document général</option>
                                        <option value="autre">Autre</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date de début
                                    </label>
                                    <input
                                        type="date"
                                        value={documentFilters.date_debut}
                                        onChange={(e) => handleFilterChange('date_debut', e.target.value)}
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date de fin
                                    </label>
                                    <input
                                        type="date"
                                        value={documentFilters.date_fin}
                                        onChange={(e) => handleFilterChange('date_fin', e.target.value)}
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-2 mt-4">
                                <button
                                    onClick={clearFilters}
                                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded"
                                >
                                    Effacer
                                </button>
                                <button
                                    onClick={applyFilters}
                                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    Appliquer
                                </button>
                            </div>
                        </div>
                    )}
                    
                    <div className="space-y-3">
                        {documents.length > 0 ? (
                            documents.map((doc, index) => (
                                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center mr-3">
                                                <FaFileMedical className="text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{doc.nom}</p>
                                                <p className="text-sm text-gray-600">{doc.type}</p>
                                                <p className="text-xs text-gray-500">
                                                    {formatFileSize(doc.taille)} • {formatDate(doc.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => setSelectedDocument(doc)}
                                                className="text-blue-500 hover:text-blue-700"
                                            >
                                                <FaEye />
                                            </button>
                                            <button className="text-green-500 hover:text-green-700">
                                                <FaDownload />
                                            </button>
                                            <button className="text-red-500 hover:text-red-700">
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-8">Aucun document uploadé</p>
                        )}
                    </div>
                </div>

                {/* Auto-mesures récentes */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <FaHeartbeat className="text-red-500 mr-2" />
                        Auto-mesures Récentes
                    </h2>
                    <div className="space-y-3">
                        {autoMesures.length > 0 ? (
                            autoMesures.slice(0, 5).map((mesure, index) => {
                                const config = getMesureConfig(mesure.type);
                                return (
                                    <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className={`w-10 h-10 ${config.bgColor} rounded flex items-center justify-center mr-3`}>
                                                    <FaHeartbeat className={config.color} />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{config.label}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {mesure.valeur} {mesure.unite}
                                                        {mesure.valeur_secondaire && ` / ${mesure.valeur_secondaire} ${mesure.unite_secondaire}`}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {formatDate(mesure.date_mesure)} à {mesure.heure_mesure}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-gray-500 text-center py-8">Aucune auto-mesure enregistrée</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Upload Document */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Uploader un document</h3>
                        <form onSubmit={handleUploadSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Fichier
                                    </label>
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        className="w-full border border-gray-300 rounded px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Type de document
                                    </label>
                                    <select
                                        value={uploadData.type}
                                        onChange={(e) => setUploadData(prev => ({ ...prev, type: e.target.value }))}
                                        className="w-full border border-gray-300 rounded px-3 py-2"
                                    >
                                        <option value="general">Document général</option>
                                        <option value="ordonnance">Ordonnance</option>
                                        <option value="resultat">Résultat d'examen</option>
                                        <option value="certificat">Certificat médical</option>
                                        <option value="autre">Autre</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={uploadData.description}
                                        onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full border border-gray-300 rounded px-3 py-2"
                                        rows="3"
                                        placeholder="Description du document..."
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowUploadModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    Uploader
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Auto-mesure */}
            {showAutoMesureModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">Nouvelle auto-mesure</h3>
                        <form onSubmit={handleAutoMesureSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Type de mesure
                                    </label>
                                    <select
                                        value={autoMesureData.type}
                                        onChange={(e) => handleTypeMesureChange(e.target.value)}
                                        className="w-full border border-gray-300 rounded px-3 py-2"
                                    >
                                        <option value="poids">Poids</option>
                                        <option value="taille">Taille</option>
                                        <option value="tension_arterielle">Tension artérielle</option>
                                        <option value="glycemie">Glycémie</option>
                                        <option value="temperature">Température</option>
                                        <option value="saturation">Saturation O2</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Valeur
                                    </label>
                                    <input
                                        type="number"
                                        value={autoMesureData.valeur}
                                        onChange={(e) => setAutoMesureData(prev => ({ ...prev, valeur: e.target.value }))}
                                        className="w-full border border-gray-300 rounded px-3 py-2"
                                        placeholder={getMesureConfig(autoMesureData.type).placeholder}
                                        step={getMesureConfig(autoMesureData.type).step}
                                        min={getMesureConfig(autoMesureData.type).min}
                                        max={getMesureConfig(autoMesureData.type).max}
                                        required
                                    />
                                </div>

                                {getMesureConfig(autoMesureData.type).hasSecondValue && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Valeur secondaire (diastolique)
                                        </label>
                                        <input
                                            type="number"
                                            value={autoMesureData.valeur_secondaire}
                                            onChange={(e) => setAutoMesureData(prev => ({ ...prev, valeur_secondaire: e.target.value }))}
                                            className="w-full border border-gray-300 rounded px-3 py-2"
                                            placeholder={getMesureConfig(autoMesureData.type).placeholder_diastolique}
                                            step={getMesureConfig(autoMesureData.type).step}
                                            min={getMesureConfig(autoMesureData.type).min}
                                            max={getMesureConfig(autoMesureData.type).max}
                                            required
                                        />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Date
                                        </label>
                                        <input
                                            type="date"
                                            value={autoMesureData.date_mesure}
                                            onChange={(e) => setAutoMesureData(prev => ({ ...prev, date_mesure: e.target.value }))}
                                            className="w-full border border-gray-300 rounded px-3 py-2"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Heure
                                        </label>
                                        <input
                                            type="time"
                                            value={autoMesureData.heure_mesure}
                                            onChange={(e) => setAutoMesureData(prev => ({ ...prev, heure_mesure: e.target.value }))}
                                            className="w-full border border-gray-300 rounded px-3 py-2"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Notes (optionnel)
                                    </label>
                                    <textarea
                                        value={autoMesureData.notes}
                                        onChange={(e) => setAutoMesureData(prev => ({ ...prev, notes: e.target.value }))}
                                        className="w-full border border-gray-300 rounded px-3 py-2"
                                        rows="3"
                                        placeholder="Notes supplémentaires..."
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAutoMesureModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                >
                                    Enregistrer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Détails Document */}
            {selectedDocument && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Détails du document</h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-600">Nom</p>
                                <p className="font-medium">{selectedDocument.nom}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Type</p>
                                <p className="font-medium">{selectedDocument.type}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Description</p>
                                <p className="font-medium">{selectedDocument.description || 'Aucune description'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Taille</p>
                                <p className="font-medium">{formatFileSize(selectedDocument.taille)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Date d'upload</p>
                                <p className="font-medium">{formatDate(selectedDocument.createdAt)}</p>
                            </div>
                        </div>
                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => setSelectedDocument(null)}
                                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DMPMonEspaceSante; 