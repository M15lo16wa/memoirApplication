import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

class PDFGenerator {
  // Générer un PDF à partir d'un élément HTML
  async generatePDFFromElement(element, options = {}) {
    try {
      // Options par défaut
      const defaultOptions = {
        filename: 'document.pdf',
        format: 'a4',
        orientation: 'portrait',
        margin: 10,
        scale: 2
      };
      
      const finalOptions = { ...defaultOptions, ...options };
      
      // Convertir l'élément HTML en canvas
      const canvas = await html2canvas(element, {
        scale: finalOptions.scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      // Calculer les dimensions du PDF
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      // Créer le PDF
      const pdf = new jsPDF(finalOptions.orientation, 'mm', finalOptions.format);
      let position = 0;
      
      // Ajouter la première page
      pdf.addImage(canvas, 'PNG', finalOptions.margin, finalOptions.margin, imgWidth - (2 * finalOptions.margin), imgHeight);
      heightLeft -= pageHeight;
      
      // Ajouter des pages supplémentaires si nécessaire
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas, 'PNG', finalOptions.margin, position + finalOptions.margin, imgWidth - (2 * finalOptions.margin), imgHeight);
        heightLeft -= pageHeight;
      }
      
      return pdf;
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      throw error;
    }
  }

  // Générer un PDF de prescription
  async generatePrescriptionPDF(prescription) {
    try {
      // Créer un élément temporaire avec le contenu HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = this.generatePrescriptionHTML(prescription);
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '800px';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.padding = '20px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      
      document.body.appendChild(tempDiv);
      
      // Générer le PDF
      const pdf = await this.generatePDFFromElement(tempDiv, {
        filename: `Prescription_${prescription.prescriptionNumber || prescription.id_prescription}_${new Date().toISOString().split('T')[0]}.pdf`,
        format: 'a4',
        orientation: 'portrait'
      });
      
      // Nettoyer
      document.body.removeChild(tempDiv);
      
      return pdf;
    } catch (error) {
      console.error('Erreur lors de la génération du PDF de prescription:', error);
      throw error;
    }
  }

  // Générer un PDF d'ordonnance
  async generateOrdonnancePDF(prescription) {
    return this.generatePrescriptionPDF(prescription); // Même template pour l'instant
  }

  // Générer un PDF de fiche d'urgence
  async generateUrgencyCardPDF(patientData) {
    try {
      // Créer un élément temporaire avec le contenu HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = this.generateUrgencyCardHTML(patientData);
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '600px';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.padding = '20px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      
      document.body.appendChild(tempDiv);
      
      // Générer le PDF
      const pdf = await this.generatePDFFromElement(tempDiv, {
        filename: `Fiche_Urgence_${patientData.nom_complet || patientData.id_patient}_${new Date().toISOString().split('T')[0]}.pdf`,
        format: 'a5',
        orientation: 'portrait'
      });
      
      // Nettoyer
      document.body.removeChild(tempDiv);
      
      return pdf;
    } catch (error) {
      console.error('Erreur lors de la génération du PDF de fiche d\'urgence:', error);
      throw error;
    }
  }

  // Générer un PDF d'historique médical
  async generateMedicalHistoryPDF(prescriptions, patientData) {
    try {
      // Créer un élément temporaire avec le contenu HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = this.generateMedicalHistoryHTML(prescriptions, patientData);
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '800px';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.padding = '20px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      
      document.body.appendChild(tempDiv);
      
      // Générer le PDF
      const pdf = await this.generatePDFFromElement(tempDiv, {
        filename: `Historique_Medical_${patientData.nom_complet || patientData.id_patient}_${new Date().toISOString().split('T')[0]}.pdf`,
        format: 'a4',
        orientation: 'portrait'
      });
      
      // Nettoyer
      document.body.removeChild(tempDiv);
      
      return pdf;
    } catch (error) {
      console.error('Erreur lors de la génération du PDF d\'historique médical:', error);
      throw error;
    }
  }

  // Générer le HTML pour une prescription
  generatePrescriptionHTML(prescription) {
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto;">
        <div style="text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px;">
          <div style="font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 10px;">🏥 HÔPITAL DU SÉNÉGAL</div>
          <div style="font-size: 18px; color: #666; margin-bottom: 5px;">${prescription.prescriptionNumber || 'N/A'}</div>
          <div style="font-size: 16px; color: #666;">Prescrit le ${formatDate(prescription.date_prescription)}</div>
        </div>

        <div style="margin-bottom: 25px;">
          <div style="font-size: 18px; font-weight: bold; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 15px;">Informations du patient</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div style="margin-bottom: 10px;">
              <div style="font-weight: bold; color: #666; margin-bottom: 5px;">Nom complet</div>
              <div style="color: #333;">${prescription.patient?.nom_complet || 'N/A'}</div>
            </div>
            <div style="margin-bottom: 10px;">
              <div style="font-weight: bold; color: #666; margin-bottom: 5px;">Numéro de dossier</div>
              <div style="color: #333;">${prescription.patient?.numero_dossier || 'N/A'}</div>
            </div>
            <div style="margin-bottom: 10px;">
              <div style="font-weight: bold; color: #666; margin-bottom: 5px;">Date de naissance</div>
              <div style="color: #333;">${formatDate(prescription.patient?.date_naissance)}</div>
            </div>
            <div style="margin-bottom: 10px;">
              <div style="font-weight: bold; color: #666; margin-bottom: 5px;">Téléphone</div>
              <div style="color: #333;">${prescription.patient?.telephone || 'N/A'}</div>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 25px;">
          <div style="font-size: 18px; font-weight: bold; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 15px;">Informations de la prescription</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div style="margin-bottom: 10px;">
              <div style="font-weight: bold; color: #666; margin-bottom: 5px;">Type</div>
              <div style="color: #333;">${prescription.type_prescription || 'N/A'}</div>
            </div>
            <div style="margin-bottom: 10px;">
              <div style="font-weight: bold; color: #666; margin-bottom: 5px;">Statut</div>
              <div style="color: #333;">${prescription.statut || 'N/A'}</div>
            </div>
            <div style="margin-bottom: 10px;">
              <div style="font-weight: bold; color: #666; margin-bottom: 5px;">Date de début</div>
              <div style="color: #333;">${formatDate(prescription.date_debut)}</div>
            </div>
            <div style="margin-bottom: 10px;">
              <div style="font-weight: bold; color: #666; margin-bottom: 5px;">Date de fin</div>
              <div style="color: #333;">${formatDate(prescription.date_fin)}</div>
            </div>
          </div>
        </div>

        ${prescription.type_prescription === 'ordonnance' ? `
        <div style="margin-bottom: 25px;">
          <div style="font-size: 18px; font-weight: bold; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 15px;">Détails de l'ordonnance</div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <div style="font-weight: bold; font-size: 16px; color: #1e40af;">${prescription.nom_commercial || prescription.principe_actif || 'Médicament'}</div>
              <div style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 14px;">${prescription.dosage || 'N/A'}</div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px;">
              <div style="margin-bottom: 10px;">
                <div style="font-weight: bold; color: #666; margin-bottom: 5px;">Principe actif</div>
                <div style="color: #333;">${prescription.principe_actif || 'N/A'}</div>
              </div>
              <div style="margin-bottom: 10px;">
                <div style="font-weight: bold; color: #666; margin-bottom: 5px;">Forme pharmaceutique</div>
                <div style="color: #333;">${prescription.forme_pharmaceutique || 'N/A'}</div>
              </div>
              <div style="margin-bottom: 10px;">
                <div style="font-weight: bold; color: #666; margin-bottom: 5px;">Fréquence</div>
                <div style="color: #333;">${prescription.frequence || 'N/A'}</div>
              </div>
              <div style="margin-bottom: 10px;">
                <div style="font-weight: bold; color: #666; margin-bottom: 5px;">Voie d'administration</div>
                <div style="color: #333;">${prescription.voie_administration || 'N/A'}</div>
              </div>
              <div style="margin-bottom: 10px;">
                <div style="font-weight: bold; color: #666; margin-bottom: 5px;">Quantité</div>
                <div style="color: #333;">${prescription.quantite ? `${prescription.quantite} ${prescription.unite || ''}` : 'N/A'}</div>
              </div>
              <div style="margin-bottom: 10px;">
                <div style="font-weight: bold; color: #666; margin-bottom: 5px;">Durée du traitement</div>
                <div style="color: #333;">${prescription.duree_traitement || 'N/A'}</div>
              </div>
            </div>
            ${prescription.posologie ? `
            <div style="margin-top: 15px;">
              <div style="font-weight: bold; color: #666; margin-bottom: 5px;">Posologie</div>
              <div style="color: #333;">${prescription.posologie}</div>
            </div>
            ` : ''}
            ${prescription.contre_indications ? `
            <div style="margin-top: 10px;">
              <div style="font-weight: bold; color: #666; margin-bottom: 5px;">Contre-indications</div>
              <div style="color: #dc2626;">${prescription.contre_indications}</div>
            </div>
            ` : ''}
            ${prescription.effets_indesirables ? `
            <div style="margin-top: 10px;">
              <div style="font-weight: bold; color: #666; margin-bottom: 5px;">Effets indésirables</div>
              <div style="color: #ea580c;">${prescription.effets_indesirables}</div>
            </div>
            ` : ''}
          </div>
        </div>
        ` : ''}

        ${prescription.description ? `
        <div style="margin-bottom: 25px;">
          <div style="font-size: 18px; font-weight: bold; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 15px;">Description</div>
          <div style="color: #333;">${prescription.description}</div>
        </div>
        ` : ''}

        ${prescription.instructions_speciales ? `
        <div style="margin-bottom: 25px;">
          <div style="font-size: 18px; font-weight: bold; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 15px;">Instructions spéciales</div>
          <div style="color: #333;">${prescription.instructions_speciales}</div>
        </div>
        ` : ''}

        <div style="margin-bottom: 25px;">
          <div style="font-size: 18px; font-weight: bold; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 15px;">Informations du prescripteur</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div style="margin-bottom: 10px;">
              <div style="font-weight: bold; color: #666; margin-bottom: 5px;">Médecin</div>
              <div style="color: #333;">Dr. ${prescription.redacteur?.nom_complet || `${prescription.redacteur?.prenom || ''} ${prescription.redacteur?.nom || ''}`.trim() || 'N/A'}</div>
            </div>
            <div style="margin-bottom: 10px;">
              <div style="font-weight: bold; color: #666; margin-bottom: 5px;">Spécialité</div>
              <div style="color: #333;">${prescription.redacteur?.specialite || 'N/A'}</div>
            </div>
            <div style="margin-bottom: 10px;">
              <div style="font-weight: bold; color: #666; margin-bottom: 5px;">N° ADELI</div>
              <div style="color: #333;">${prescription.redacteur?.numero_adeli || 'N/A'}</div>
            </div>
            <div style="margin-bottom: 10px;">
              <div style="font-weight: bold; color: #666; margin-bottom: 5px;">Établissement</div>
              <div style="color: #333;">${prescription.etablissement || 'Hôpital du Sénégal'}</div>
            </div>
          </div>
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <div style="margin-top: 30px; text-align: right;">
            <div style="border-top: 1px solid #333; width: 200px; margin-left: auto; margin-top: 40px;"></div>
            <div style="text-align: center; margin-top: 10px;">
              Signature et cachet du médecin
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Générer le HTML pour une ordonnance
  generateOrdonnanceHTML(prescription) {
    return this.generatePrescriptionHTML(prescription); // Pour l'instant, même template
  }

  // Générer le HTML pour une fiche d'urgence
  generateUrgencyCardHTML(patientData) {
    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; background: #dc2626; color: white; padding: 20px; margin: -20px -20px 20px -20px;">
          <div style="font-size: 28px; font-weight: bold; margin-bottom: 10px;">🚨 FICHE D'URGENCE 🚨</div>
          <div style="font-size: 24px; margin-bottom: 10px;">${patientData.nom_complet || 'N/A'}</div>
        </div>

        <div style="margin-bottom: 25px; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px;">
          <div style="font-size: 20px; font-weight: bold; color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px; margin-bottom: 20px;">Informations personnelles</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div style="margin-bottom: 15px;">
              <div style="font-weight: bold; color: #666; margin-bottom: 5px; font-size: 14px;">Nom complet</div>
              <div style="color: #333; font-size: 16px;">${patientData.nom_complet || 'N/A'}</div>
            </div>
            <div style="margin-bottom: 15px;">
              <div style="font-weight: bold; color: #666; margin-bottom: 5px; font-size: 14px;">Date de naissance</div>
              <div style="color: #333; font-size: 16px;">${patientData.date_naissance || 'N/A'}</div>
            </div>
            <div style="margin-bottom: 15px;">
              <div style="font-weight: bold; color: #666; margin-bottom: 5px; font-size: 14px;">Groupe sanguin</div>
              <div style="color: #333; font-size: 16px;">${patientData.groupe_sanguin || 'Non renseigné'}</div>
            </div>
            <div style="margin-bottom: 15px;">
              <div style="font-weight: bold; color: #666; margin-bottom: 5px; font-size: 14px;">Numéro de dossier</div>
              <div style="color: #333; font-size: 16px;">${patientData.numero_dossier || 'N/A'}</div>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 25px; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px;">
          <div style="font-size: 20px; font-weight: bold; color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px; margin-bottom: 20px;">Informations médicales</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div style="margin-bottom: 15px;">
              <div style="font-weight: bold; color: #666; margin-bottom: 5px; font-size: 14px;">Allergies</div>
              <div style="color: #333; font-size: 16px;">${patientData.allergies || 'Aucune connue'}</div>
            </div>
            <div style="margin-bottom: 15px;">
              <div style="font-weight: bold; color: #666; margin-bottom: 5px; font-size: 14px;">Maladies chroniques</div>
              <div style="color: #333; font-size: 16px;">${patientData.maladies_chroniques || 'Aucune connue'}</div>
            </div>
            <div style="margin-bottom: 15px;">
              <div style="font-weight: bold; color: #666; margin-bottom: 5px; font-size: 14px;">Traitements en cours</div>
              <div style="color: #333; font-size: 16px;">${patientData.traitements_cours || 'Aucun'}</div>
            </div>
            <div style="margin-bottom: 15px;">
              <div style="font-weight: bold; color: #666; margin-bottom: 5px; font-size: 14px;">Antécédents chirurgicaux</div>
              <div style="color: #333; font-size: 16px;">${patientData.antecedents_chirurgicaux || 'Aucun'}</div>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 25px; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px;">
          <div style="font-size: 20px; font-weight: bold; color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px; margin-bottom: 20px;">Contacts d'urgence</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div style="margin-bottom: 15px;">
              <div style="font-weight: bold; color: #666; margin-bottom: 5px; font-size: 14px;">Contact principal</div>
              <div style="color: #333; font-size: 16px;">${patientData.contact_urgence || patientData.telephone || 'N/A'}</div>
            </div>
            <div style="margin-bottom: 15px;">
              <div style="font-weight: bold; color: #666; margin-bottom: 5px; font-size: 14px;">Médecin traitant</div>
              <div style="color: #333; font-size: 16px;">${patientData.medecin_traitant || 'Non renseigné'}</div>
            </div>
          </div>
        </div>

        <div style="background: #dc2626; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-top: 30px;">
          <div style="font-size: 20px; font-weight: bold; margin-bottom: 15px;">🚨 CONTACTEZ LES SERVICES D'URGENCE 🚨</div>
          <div style="font-size: 18px; margin-bottom: 10px;">📞 15 (SAMU) ou 18 (Pompiers)</div>
          <div style="font-size: 18px; margin-bottom: 10px;">🏥 Hôpital du Sénégal</div>
        </div>
      </div>
    `;
  }

  // Générer le HTML pour l'historique médical
  generateMedicalHistoryHTML(prescriptions, patientData) {
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto;">
        <div style="text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px;">
          <div style="font-size: 28px; font-weight: bold; color: #2563eb; margin-bottom: 10px;">📋 HISTORIQUE MÉDICAL</div>
          <div style="font-size: 18px; color: #666; margin-bottom: 5px;">${patientData.nom_complet || 'N/A'}</div>
          <div style="font-size: 16px; color: #666;">Généré le ${new Date().toLocaleDateString('fr-FR')}</div>
        </div>

        <div style="margin-bottom: 30px;">
          <div style="font-size: 20px; font-weight: bold; color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 20px;">Informations du patient</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
            <div style="margin-bottom: 10px;">
              <div style="font-weight: bold; color: #666; margin-bottom: 5px; font-size: 14px;">Nom complet</div>
              <div style="color: #333; font-size: 14px;">${patientData.nom_complet || 'N/A'}</div>
            </div>
            <div style="margin-bottom: 10px;">
              <div style="font-weight: bold; color: #666; margin-bottom: 5px; font-size: 14px;">Numéro de dossier</div>
              <div style="color: #333; font-size: 14px;">${patientData.numero_dossier || 'N/A'}</div>
            </div>
            <div style="margin-bottom: 10px;">
              <div style="font-weight: bold; color: #666; margin-bottom: 5px; font-size: 14px;">Date de naissance</div>
              <div style="color: #333; font-size: 14px;">${formatDate(patientData.date_naissance)}</div>
            </div>
            <div style="margin-bottom: 10px;">
              <div style="font-weight: bold; color: #666; margin-bottom: 5px; font-size: 14px;">Téléphone</div>
              <div style="color: #333; font-size: 14px;">${patientData.telephone || 'N/A'}</div>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <div style="font-size: 20px; font-weight: bold; color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 20px;">Statistiques</div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px;">
            <div style="text-align: center; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
              <div style="font-size: 32px; font-weight: bold; color: #2563eb; margin-bottom: 5px;">${prescriptions.length}</div>
              <div style="color: #666; font-size: 14px;">Total prescriptions</div>
            </div>
            <div style="text-align: center; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
              <div style="font-size: 32px; font-weight: bold; color: #2563eb; margin-bottom: 5px;">${prescriptions.filter(p => p.type_prescription === 'ordonnance').length}</div>
              <div style="color: #666; font-size: 14px;">Ordonnances</div>
            </div>
            <div style="text-align: center; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
              <div style="font-size: 32px; font-weight: bold; color: #2563eb; margin-bottom: 5px;">${prescriptions.filter(p => p.type_prescription === 'examen').length}</div>
              <div style="color: #666; font-size: 14px;">Examens</div>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <div style="font-size: 20px; font-weight: bold; color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 20px;">Prescriptions</div>
          ${prescriptions.map(prescription => `
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px; background: #f8fafc;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0;">
                <div style="font-size: 18px; font-weight: bold; color: #1e40af;">${prescription.type_prescription === 'ordonnance' ? '💊 Ordonnance' : prescription.type_prescription === 'examen' ? '🔬 Examen' : '📋 ' + prescription.type_prescription}</div>
                <div style="color: #666; font-size: 14px;">${formatDate(prescription.date_prescription)}</div>
                <div style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">${prescription.prescriptionNumber || 'N/A'}</div>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
                <div style="margin-bottom: 10px;">
                  <div style="font-weight: bold; color: #666; margin-bottom: 5px; font-size: 14px;">Statut</div>
                  <div style="color: #333; font-size: 14px;">${prescription.statut || 'N/A'}</div>
                </div>
                <div style="margin-bottom: 10px;">
                  <div style="font-weight: bold; color: #666; margin-bottom: 5px; font-size: 14px;">Médecin</div>
                  <div style="color: #333; font-size: 14px;">Dr. ${prescription.redacteur?.nom_complet || `${prescription.redacteur?.prenom || ''} ${prescription.redacteur?.nom || ''}`.trim() || 'N/A'}</div>
                </div>
                <div style="margin-bottom: 10px;">
                  <div style="font-weight: bold; color: #666; margin-bottom: 5px; font-size: 14px;">Date de début</div>
                  <div style="color: #333; font-size: 14px;">${formatDate(prescription.date_debut)}</div>
                </div>
                <div style="margin-bottom: 10px;">
                  <div style="font-weight: bold; color: #666; margin-bottom: 5px; font-size: 14px;">Date de fin</div>
                  <div style="color: #333; font-size: 14px;">${formatDate(prescription.date_fin)}</div>
                </div>
              </div>

              ${prescription.description ? `
                <div style="margin-bottom: 10px;">
                  <div style="font-weight: bold; color: #666; margin-bottom: 5px; font-size: 14px;">Description</div>
                  <div style="color: #333; font-size: 14px;">${prescription.description}</div>
                </div>
              ` : ''}

              ${prescription.type_prescription === 'ordonnance' ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                  <div style="font-weight: bold; color: #666; margin-bottom: 10px; font-size: 14px;">Médicament prescrit</div>
                  <div style="background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 10px;">
                    <div style="font-weight: bold; color: #1e40af; margin-bottom: 5px;">${prescription.nom_commercial || prescription.principe_actif || 'Médicament'}</div>
                    <div style="font-size: 13px; color: #666;">
                      <strong>Dosage:</strong> ${prescription.dosage || 'N/A'} | 
                      <strong>Fréquence:</strong> ${prescription.frequence || 'N/A'} | 
                      <strong>Voie:</strong> ${prescription.voie_administration || 'N/A'}
                    </div>
                    ${prescription.posologie ? `<div style="font-size: 13px; color: #666; margin-top: 5px;"><strong>Posologie:</strong> ${prescription.posologie}</div>` : ''}
                  </div>
                </div>
              ` : ''}

              ${prescription.type_prescription === 'examen' ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                  <div style="font-weight: bold; color: #666; margin-bottom: 10px; font-size: 14px;">Examens demandés</div>
                  <div style="background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 10px;">
                    <div style="font-weight: bold; color: #1e40af; margin-bottom: 5px;">${prescription.description || 'Examen médical'}</div>
                    <div style="font-size: 13px; color: #666;">
                      <strong>Type:</strong> ${prescription.type || 'N/A'} | 
                      <strong>Urgence:</strong> ${prescription.urgence || 'Non'}
                    </div>
                  </div>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #666;">
          <p>Ce document a été généré automatiquement le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
          <p>Hôpital du Sénégal - Système DMP</p>
        </div>
      </div>
    `;
  }

  // Télécharger un PDF
  downloadPDF(pdf, filename) {
    pdf.save(filename);
  }

  // Imprimer un PDF
  printPDF(pdf) {
    // Ouvrir le PDF dans une nouvelle fenêtre pour l'impression
    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(pdfUrl);
    
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
        setTimeout(() => {
          printWindow.close();
          URL.revokeObjectURL(pdfUrl);
        }, 1000);
      };
    }
  }
}

export default new PDFGenerator();
