// src/hooks/usePDFGenerator.js

import { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const usePDFGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  // Fonction interne pour créer le HTML de la prescription
  const createPrescriptionHTML = (prescription) => {
    // Vérification de sécurité
    if (!prescription) {
      throw new Error("Prescription manquante pour la génération du HTML");
    }

    // Log pour debug
    console.log("🔍 [usePDFGenerator] Données prescription pour HTML:", {
      id: prescription.id,
      hasPatient: !!prescription.patient,
      hasRedacteur: !!prescription.redacteur,
      patientKeys: prescription.patient ? Object.keys(prescription.patient) : [],
      redacteurKeys: prescription.redacteur ? Object.keys(prescription.redacteur) : []
    });

    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      try {
        return new Date(dateString).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
      } catch (error) {
        console.warn("⚠️ [usePDFGenerator] Erreur formatage date:", dateString, error);
        return 'Date invalide';
      }
    };

    // Fonction pour générer la section des détails du médicament
    const renderMedicationDetails = (p) => {
      if (p.description) {
        return `<div style="white-space: pre-wrap; font-size: 16px; line-height: 1.6;">${p.description}</div>`;
      }
      if (p.nom_commercial || p.dosage || p.principe_actif || p.frequence || p.duree_traitement) {
        return `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; font-size: 14px; line-height: 1.6; background-color: #f7fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
            ${p.nom_commercial ? `<div><strong>Médicament:</strong> ${p.nom_commercial}</div>` : ''}
            ${p.principe_actif ? `<div><strong>Principe actif:</strong> ${p.principe_actif}</div>` : ''}
            ${p.dosage ? `<div><strong>Dosage:</strong> ${p.dosage}</div>` : ''}
            ${p.frequence ? `<div><strong>Fréquence:</strong> ${p.frequence}</div>` : ''}
            ${p.voie_administration ? `<div><strong>Voie:</strong> ${p.voie_administration}</div>` : ''}
            ${p.duree_traitement ? `<div><strong>Durée:</strong> ${p.duree_traitement}</div>` : ''}
            ${p.renouvelable !== null ? `<div><strong>Renouvelable:</strong> ${p.renouvelable ? 'Oui' : 'Non'}</div>` : ''}
          </div>
        `;
      }
      return '<p>Aucun détail fourni.</p>';
    };

    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; padding: 40px; background: white; color: #333;">
        <div style="text-align: center; border-bottom: 2px solid #ccc; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="font-size: 28px; font-weight: bold;">ORDONNANCE MÉDICALE</h1>
            <p>Date: ${formatDate(prescription.date_prescription)}</p>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
            <div>
                <h2 style="font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px;">Patient</h2>
                <p><strong>Nom:</strong> ${prescription.patient?.prenom || ''} ${prescription.patient?.nom || ''}</p>
                <p><strong>Date de naissance:</strong> ${formatDate(prescription.patient?.date_naissance)}</p>
            </div>
            <div>
                <h2 style="font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px;">Médecin</h2>
                <p><strong>Nom:</strong> Dr. ${prescription.redacteur?.prenom || ''} ${prescription.redacteur?.nom || ''}</p>
                <p><strong>Spécialité:</strong> ${prescription.redacteur?.specialite || 'N/A'}</p>
            </div>
        </div>
        <div style="margin-bottom: 40px;">
            <h2 style="font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 15px;">Prescription</h2>
            ${renderMedicationDetails(prescription)}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 40px; padding-top: 20px; border-top: 2px solid #eee;">
          <div style="flex: 2; padding-right: 20px;">
            <h2 style="font-size: 18px; margin: 0 0 15px 0;">Informations de sécurité</h2>
            <div style="font-size: 14px; line-height: 1.6;">
              <p><strong>Statut:</strong> <span style="font-weight: bold; color: green;">${prescription.statut || 'N/A'}</span></p>
              <p><strong>Début:</strong> ${formatDate(prescription.date_debut)}</p>
            </div>
          </div>
          ${prescription.qrCode ? `
            <div style="flex: 1; text-align: center;">
              <h2 style="font-size: 18px; margin: 0 0 15px 0;">QR Code</h2>
              <div style="padding: 10px; border: 1px solid #ddd; border-radius: 8px; display: inline-block;">
                <img src="${prescription.qrCode}" alt="QR Code" style="width: 120px; height: 120px;" />
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  };

  const generateAndDownloadPDF = async (prescription) => {
    if (!prescription) {
      const error = new Error("Les données de la prescription sont manquantes.");
      console.error("❌ [usePDFGenerator]", error.message);
      throw error;
    }

    // Vérifier que les données essentielles sont présentes
    if (!prescription.patient && !prescription.redacteur) {
      const error = new Error("Données patient ou médecin manquantes dans la prescription");
      console.error("❌ [usePDFGenerator]", error.message, prescription);
      throw error;
    }

    setIsGenerating(true);
    try {
      console.log("🔄 [usePDFGenerator] Génération du PDF pour la prescription:", prescription.id);
      
      const htmlContent = createPrescriptionHTML(prescription);
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '800px';
      tempDiv.innerHTML = htmlContent;
      document.body.appendChild(tempDiv);

      console.log("🔄 [usePDFGenerator] Conversion HTML vers canvas...");
      const canvas = await html2canvas(tempDiv, { 
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false
      });
      document.body.removeChild(tempDiv);

      console.log("🔄 [usePDFGenerator] Création du PDF...");
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdfHeight = pdf.internal.pageSize.getHeight();
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      let heightLeft = imgHeight - pdfHeight;

      while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      const filename = `ordonnance_${prescription.id || 'prescription'}.pdf`;
      pdf.save(filename);
      console.log("✅ [usePDFGenerator] PDF généré et téléchargé:", filename);

    } catch (error) {
      console.error('❌ [usePDFGenerator] Erreur lors de la génération du PDF:', error);
      throw error; // Propager l'erreur pour la gestion dans le composant
    } finally {
      setIsGenerating(false);
    }
  };

  // Fonction pour télécharger le PDF
  const downloadPrescriptionPDF = async (prescription) => {
    return generateAndDownloadPDF(prescription);
  };

  // Fonction pour imprimer le PDF (redirige vers le téléchargement pour l'instant)
  const printPrescriptionPDF = async (prescription) => {
    try {
      await generateAndDownloadPDF(prescription);
      // Optionnel : ouvrir le PDF dans un nouvel onglet pour l'impression
      // window.open(`ordonnance_${prescription.id || 'prescription'}.pdf`, '_blank');
    } catch (error) {
      console.error('Erreur lors de l\'impression du PDF:', error);
      throw error;
    }
  };

  return { 
    isGenerating, 
    generateAndDownloadPDF,
    downloadPrescriptionPDF,
    printPrescriptionPDF
  };
};