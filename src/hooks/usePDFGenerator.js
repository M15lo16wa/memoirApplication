import { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const usePDFGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  // Fonction pour générer un PDF d'ordonnance
  const generatePrescriptionPDF = async (prescription) => {
    if (!prescription) {
      throw new Error('Prescription data is required');
    }

    setIsGenerating(true);
    
    try {
      // Créer le contenu HTML pour la prescription
      const htmlContent = createPrescriptionHTML(prescription);
      
      // Créer un élément temporaire pour le rendu
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '800px'; // Largeur fixe pour le PDF
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.padding = '20px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = '12px';
      tempDiv.style.lineHeight = '1.4';
      
      document.body.appendChild(tempDiv);

      // Convertir en canvas puis en PDF
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: tempDiv.scrollHeight
      });

      // Nettoyer l'élément temporaire
      document.body.removeChild(tempDiv);

      // Créer le PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      // Calculer les dimensions pour s'adapter à la page A4
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20; // Marge de 10mm de chaque côté
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Ajouter l'image au PDF
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      
      // Si le contenu dépasse une page, ajouter des pages
      let heightLeft = imgHeight;
      let position = 10;
      
      while (heightLeft >= pageHeight) {
        position = heightLeft - pageHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, -position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      return pdf;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  // Fonction pour créer le HTML d'une prescription
  const createPrescriptionHTML = (prescription) => {
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      try {
        return new Date(dateString).toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch {
        return dateString;
      }
    };

    const getStatusColor = (statut) => {
      switch (statut) {
        case 'actif': return '#10B981';
        case 'inactif': return '#6B7280';
        case 'expire': return '#EF4444';
        default: return '#6B7280';
      }
    };

    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: white;">
        <!-- En-tête de l'ordonnance -->
        <div style="text-align: center; border-bottom: 3px solid #2563EB; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #1E40AF; font-size: 28px; margin: 0; font-weight: bold;">
            ORDONNANCE MÉDICALE
          </h1>
          <div style="display: flex; justify-content: space-between; margin-top: 20px; font-size: 14px;">
            <div style="text-align: left;">
              <strong>Date de prescription:</strong><br>
              ${formatDate(prescription.date_prescription)}
            </div>
            <div style="text-align: right;">
              <strong>Numéro:</strong><br>
              ${prescription.prescriptionNumber || 'N/A'}
            </div>
          </div>
        </div>

        <!-- Informations du patient -->
        <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #2563EB;">
          <h2 style="color: #1E40AF; font-size: 20px; margin: 0 0 15px 0;">Informations du patient</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px;">
            <div>
              <strong>Nom:</strong> ${prescription.patient?.nom || 'N/A'}<br>
              <strong>Prénom:</strong> ${prescription.patient?.prenom || 'N/A'}<br>
              <strong>Date de naissance:</strong> ${formatDate(prescription.patient?.date_naissance)}
            </div>
            <div>
              <strong>Numéro de dossier:</strong> ${prescription.patient?.numero_dossier || 'N/A'}<br>
              <strong>Groupe sanguin:</strong> ${prescription.patient?.groupe_sanguin || 'N/A'}<br>
              <strong>Allergies:</strong> ${prescription.patient?.allergies || 'Aucune connue'}
            </div>
          </div>
        </div>

        <!-- Informations du médecin -->
        <div style="background: #F0F9FF; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #0EA5E9;">
          <h2 style="color: #0369A1; font-size: 20px; margin: 0 0 15px 0;">Médecin prescripteur</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px;">
            <div>
              <strong>Nom:</strong> Dr. ${prescription.redacteur?.nom || prescription.medecin?.nom || 'N/A'}<br>
              <strong>Prénom:</strong> ${prescription.redacteur?.prenom || prescription.medecin?.prenom || 'N/A'}<br>
              <strong>Spécialité:</strong> ${prescription.redacteur?.specialite || prescription.medecin?.specialite || 'N/A'}
            </div>
            <div>
              <strong>N° ADELI:</strong> ${prescription.redacteur?.numero_adeli || 'N/A'}<br>
              <strong>Établissement:</strong> ${prescription.etablissement || 'N/A'}<br>
              <strong>Signature:</strong> ${prescription.signatureElectronique ? 'Signature électronique présente' : 'Non signée'}
            </div>
          </div>
        </div>

        <!-- Description de la prescription -->
        ${prescription.description ? `
          <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #F59E0B;">
            <h2 style="color: #92400E; font-size: 20px; margin: 0 0 15px 0;">Description</h2>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #78350F;">
              ${prescription.description}
            </p>
          </div>
        ` : ''}

        <!-- Détails spécifiques de l'ordonnance -->
        ${prescription.type_prescription === 'ordonnance' && (prescription.nom_commercial || prescription.principe_actif || prescription.dosage) ? `
          <div style="background: #DBEAFE; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #2563EB;">
            <h2 style="color: #1E40AF; font-size: 20px; margin: 0 0 15px 0;">Détails de l'ordonnance</h2>
            
            <!-- Informations principales du médicament -->
            <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 15px; border: 1px solid #BFDBFE;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px;">
                ${prescription.nom_commercial ? `
                  <div style="background: #F0F9FF; padding: 8px; border-radius: 4px; border-left: 3px solid #0EA5E9;">
                    <strong style="color: #0369A1;">Médicament:</strong><br>
                    <span style="color: #0C4A6E; font-weight: 500;">${prescription.nom_commercial}</span>
                  </div>
                ` : ''}
                ${prescription.principe_actif ? `
                  <div style="background: #F0F9FF; padding: 8px; border-radius: 4px; border-left: 3px solid #0EA5E9;">
                    <strong style="color: #0369A1;">Principe actif:</strong><br>
                    <span style="color: #0C4A6E; font-weight: 500;">${prescription.principe_actif}</span>
                  </div>
                ` : ''}
                ${prescription.dosage ? `
                  <div style="background: #F0F9FF; padding: 8px; border-radius: 4px; border-left: 3px solid #0EA5E9;">
                    <strong style="color: #0369A1;">Dosage:</strong><br>
                    <span style="color: #0C4A6E; font-weight: 500;">${prescription.dosage}</span>
                  </div>
                ` : ''}
                ${prescription.frequence ? `
                  <div style="background: #F0F9FF; padding: 8px; border-radius: 4px; border-left: 3px solid #0EA5E9;">
                    <strong style="color: #0369A1;">Fréquence:</strong><br>
                    <span style="color: #0C4A6E; font-weight: 500;">${prescription.frequence}</span>
                  </div>
                ` : ''}
                ${prescription.voie_administration ? `
                  <div style="background: #F0F9FF; padding: 8px; border-radius: 4px; border-left: 3px solid #0EA5E9;">
                    <strong style="color: #0369A1;">Voie d'administration:</strong><br>
                    <span style="color: #0C4A6E; font-weight: 500;">${prescription.voie_administration}</span>
                  </div>
                ` : ''}
                ${prescription.quantite && prescription.unite ? `
                  <div style="background: #F0F9FF; padding: 8px; border-radius: 4px; border-left: 3px solid #0EA5E9;">
                    <strong style="color: #0369A1;">Quantité:</strong><br>
                    <span style="color: #0C4A6E; font-weight: 500;">${prescription.quantite} ${prescription.unite}</span>
                  </div>
                ` : ''}
                ${prescription.forme_pharmaceutique ? `
                  <div style="background: #F0F9FF; padding: 8px; border-radius: 4px; border-left: 3px solid #0EA5E9;">
                    <strong style="color: #0369A1;">Forme:</strong><br>
                    <span style="color: #0C4A6E; font-weight: 500;">${prescription.forme_pharmaceutique}</span>
                  </div>
                ` : ''}
                ${prescription.code_cip ? `
                  <div style="background: #F0F9FF; padding: 8px; border-radius: 4px; border-left: 3px solid #0EA5E9;">
                    <strong style="color: #0369A1;">Code CIP:</strong><br>
                    <span style="color: #0C4A6E; font-weight: 500;">${prescription.code_cip}</span>
                  </div>
                ` : ''}
                ${prescription.atc ? `
                  <div style="background: #F0F9FF; padding: 8px; border-radius: 4px; border-left: 3px solid #0EA5E9;">
                    <strong style="color: #0369A1;">Code ATC:</strong><br>
                    <span style="color: #0C4A6E; font-weight: 500;">${prescription.atc}</span>
                  </div>
                ` : ''}
              </div>
            </div>
            
            <!-- Posologie détaillée -->
            ${prescription.posologie ? `
              <div style="background: #FEF3C7; padding: 15px; border-radius: 6px; margin-bottom: 15px; border-left: 3px solid #F59E0B;">
                <h3 style="color: #92400E; font-size: 16px; margin: 0 0 10px 0;">📋 Posologie</h3>
                <p style="margin: 0; color: #78350F; font-size: 14px; line-height: 1.5;">${prescription.posologie}</p>
              </div>
            ` : ''}
            
            <!-- Contre-indications -->
            ${prescription.contre_indications ? `
              <div style="background: #FEE2E2; padding: 15px; border-radius: 6px; margin-bottom: 15px; border-left: 3px solid #EF4444;">
                <h3 style="color: #991B1B; font-size: 16px; margin: 0 0 10px 0;">⚠️ Contre-indications</h3>
                <p style="margin: 0; color: #7F3D1D; font-size: 14px; line-height: 1.5;">${prescription.contre_indications}</p>
              </div>
            ` : ''}
            
            <!-- Effets indésirables -->
            ${prescription.effets_indesirables ? `
              <div style="background: #FEF3C7; padding: 15px; border-radius: 6px; margin-bottom: 15px; border-left: 3px solid #F59E0B;">
                <h3 style="color: #92400E; font-size: 16px; margin: 0 0 10px 0;">💊 Effets indésirables</h3>
                <p style="margin: 0; color: #78350F; font-size: 14px; line-height: 1.5;">${prescription.effets_indesirables}</p>
              </div>
            ` : ''}
            
            <!-- Instructions spéciales -->
            ${prescription.instructions_speciales ? `
              <div style="background: #F3E8FF; padding: 15px; border-radius: 6px; margin-bottom: 15px; border-left: 3px solid #9333EA;">
                <h3 style="color: #6B21A8; font-size: 16px; margin: 0 0 10px 0;">📝 Instructions spéciales</h3>
                <p style="margin: 0; color: #581C87; font-size: 14px; line-height: 1.5;">${prescription.instructions_speciales}</p>
              </div>
            ` : ''}
          </div>
        ` : ''}

        <!-- Médicaments prescrits -->
        ${prescription.medicaments && prescription.medicaments.length > 0 ? `
          <div style="background: #F0FDF4; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #16A34A;">
            <h2 style="color: #15803D; font-size: 20px; margin: 0 0 15px 0;">Médicaments prescrits</h2>
            ${prescription.medicaments.map((med, idx) => `
              <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 10px; border: 1px solid #BBF7D0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <strong style="color: #15803D; font-size: 16px;">${med.nom}</strong>
                  ${med.quantite ? `
                    <span style="background: #16A34A; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">
                      Qté: ${med.quantite}
                    </span>
                  ` : ''}
                </div>
                ${med.posologie ? `
                  <div style="margin-bottom: 5px;"><strong>Posologie:</strong> ${med.posologie}</div>
                ` : ''}
                ${med.duree ? `
                  <div style="margin-bottom: 5px;"><strong>Durée:</strong> ${med.duree}</div>
                ` : ''}
                ${med.instructions ? `
                  <div style="color: #059669; font-style: italic; font-size: 13px;">${med.instructions}</div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Examens demandés -->
        ${prescription.examens && prescription.examens.length > 0 ? `
          <div style="background: #F0FDF4; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #16A34A;">
            <h2 style="color: #15803D; font-size: 20px; margin: 0 0 15px 0;">Examens demandés</h2>
            ${prescription.examens.map((exam, idx) => `
              <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 10px; border: 1px solid #BBF7D0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <strong style="color: #15803D; font-size: 16px;">${exam.nom}</strong>
                  ${exam.urgence ? `
                    <span style="background: ${exam.urgence === 'urgent' ? '#DC2626' : '#16A34A'}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">
                      ${exam.urgence === 'urgent' ? 'URGENT' : exam.urgence}
                    </span>
                  ` : ''}
                </div>
                ${exam.type ? `
                  <div style="margin-bottom: 5px;"><strong>Type:</strong> ${exam.type}</div>
                ` : ''}
                ${exam.instructions ? `
                  <div style="color: #059669; font-style: italic; font-size: 13px;">${exam.instructions}</div>
                ` : ''}
                ${exam.preparation ? `
                  <div style="margin-top: 5px;"><strong>Préparation:</strong> ${exam.preparation}</div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Informations de traitement -->
        ${(prescription.duree_traitement || prescription.renouvelable !== null || prescription.nb_renouvellements > 0) ? `
          <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #F59E0B;">
            <h2 style="color: #92400E; font-size: 20px; margin: 0 0 15px 0;">Informations de traitement</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px;">
              ${prescription.duree_traitement ? `
                <div><strong>Durée du traitement:</strong> ${prescription.duree_traitement}</div>
              ` : ''}
              ${prescription.renouvelable !== null ? `
                <div><strong>Renouvelable:</strong> ${prescription.renouvelable ? 'Oui' : 'Non'}</div>
              ` : ''}
              ${prescription.nb_renouvellements > 0 ? `
                <div><strong>Renouvellements:</strong> ${prescription.renouvellements_effectues || 0}/${prescription.nb_renouvellements}</div>
              ` : ''}
            </div>
          </div>
        ` : ''}

        <!-- Instructions spéciales -->
        ${prescription.instructions_speciales ? `
          <div style="background: #FEE2E2; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #EF4444;">
            <h2 style="color: #991B1B; font-size: 20px; margin: 0 0 15px 0;">Instructions spéciales</h2>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #7F1D1D;">
              ${prescription.instructions_speciales}
            </p>
          </div>
        ` : ''}

        <!-- Pharmacie de délivrance -->
        ${prescription.pharmacieDelivrance ? `
          <div style="background: #F3E8FF; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #9333EA;">
            <h2 style="color: #6B21A8; font-size: 20px; margin: 0 0 15px 0;">Pharmacie de délivrance</h2>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #581C87;">
              ${prescription.pharmacieDelivrance}
            </p>
          </div>
        ` : ''}

        <!-- QR Code et informations de sécurité -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 30px; padding-top: 20px; border-top: 2px solid #E5E7EB;">
          <div style="flex: 1;">
            <h3 style="color: #374151; font-size: 18px; margin: 0 0 15px 0;">Informations de sécurité</h3>
            <div style="font-size: 12px; color: #6B7280; line-height: 1.5;">
              <p><strong>Statut:</strong> <span style="color: ${getStatusColor(prescription.statut)}; font-weight: bold;">${prescription.statut || 'Statut inconnu'}</span></p>
              ${prescription.date_debut ? `<p><strong>Début:</strong> ${formatDate(prescription.date_debut)}</p>` : ''}
              ${prescription.date_fin ? `<p><strong>Fin:</strong> ${formatDate(prescription.date_fin)}</p>` : ''}
              ${prescription.validite ? `<p><strong>Validité:</strong> ${prescription.validite}</p>` : ''}
              ${prescription.signatureElectronique ? `
                <p><strong>Signature électronique:</strong> Présente</p>
                <p style="font-family: monospace; font-size: 10px; word-break: break-all; margin-top: 5px;">
                  ${prescription.signatureElectronique.substring(0, 50)}...
                </p>
              ` : ''}
            </div>
          </div>
          
          <!-- QR Code -->
          ${prescription.qrCode ? `
            <div style="text-align: center; margin-left: 20px;">
              <h3 style="color: #374151; font-size: 18px; margin: 0 0 15px 0;">QR Code</h3>
              <div style="background: white; padding: 15px; border: 2px solid #E5E7EB; border-radius: 8px; display: inline-block;">
                <img src="${prescription.qrCode}" alt="QR Code de la prescription" style="width: 100px; height: 100px; border: 1px solid #D1D5DB; border-radius: 4px;" />
              </div>
              <p style="font-size: 11px; color: #6B7280; margin-top: 8px; max-width: 120px;">
                Scannez pour vérifier l'authenticité
              </p>
            </div>
          ` : ''}
        </div>

        <!-- Pied de page -->
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; color: #6B7280; font-size: 12px;">
          <p><strong>Document généré automatiquement par le système DMP</strong></p>
          <p>Dossier Médical Partagé - ${new Date().toLocaleDateString('fr-FR')}</p>
          <p style="font-size: 10px; margin-top: 10px;">
            Ce document est valide uniquement avec la signature électronique du médecin prescripteur
          </p>
        </div>
      </div>
    `;
  };

  // Fonction pour télécharger le PDF
  const downloadPrescriptionPDF = async (prescription, filename = null) => {
    try {
      const pdf = await generatePrescriptionPDF(prescription);
      const defaultFilename = `ordonnance_${prescription.prescriptionNumber || prescription.id || 'prescription'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename || defaultFilename);
      return true;
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  };

  // Fonction pour imprimer le PDF
  const printPrescriptionPDF = async (prescription) => {
    try {
      const pdf = await generatePrescriptionPDF(prescription);
      pdf.autoPrint();
      pdf.output('dataurlnewwindow');
      return true;
    } catch (error) {
      console.error('Error printing PDF:', error);
      throw error;
    }
  };

  return {
    isGenerating,
    generatePrescriptionPDF,
    downloadPrescriptionPDF,
    printPrescriptionPDF,
    createPrescriptionHTML
  };
};
