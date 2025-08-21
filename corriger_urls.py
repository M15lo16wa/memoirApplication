#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🚨 SCRIPT DE CORRECTION AUTOMATIQUE - URLs Auto-mesures DMP
Corrige automatiquement toutes les URLs incorrectes dans dmpApi.js
"""

import os
import re
import shutil
from datetime import datetime

def backup_file(file_path):
    """Créer une sauvegarde du fichier avant modification"""
    backup_path = f"{file_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    shutil.copy2(file_path, backup_path)
    print(f"✅ Sauvegarde créée : {backup_path}")
    return backup_path

def correct_urls(file_path):
    """Corriger toutes les URLs incorrectes dans le fichier"""
    
    # Vérifier que le fichier existe
    if not os.path.exists(file_path):
        print(f"❌ Fichier non trouvé : {file_path}")
        return False
    
    # Créer une sauvegarde
    backup_path = backup_file(file_path)
    
    # Lire le contenu du fichier
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Définir les corrections à appliquer
    corrections = [
        {
            'search': r'/patient/auto-mesures',
            'replace': '/patients/dmp/auto-mesures',
            'description': 'URLs CRUD par ID (lignes 640, 651, 662)'
        },
        {
            'search': r'/patient/\$\{patientId\}/auto-mesures/stats',
            'replace': '/patients/${patientId}/dmp/auto-mesures/stats',
            'description': 'URL des statistiques (ligne 680)'
        },
        {
            'search': r'/patient/\$\{patientId\}/auto-mesures/last',
            'replace': '/patients/${patientId}/dmp/auto-mesures/last',
            'description': 'URL de la dernière mesure (ligne 690)'
        }
    ]
    
    # Appliquer chaque correction
    original_content = content
    for i, correction in enumerate(corrections, 1):
        print(f"\n🔧 CORRECTION {i} : {correction['description']}")
        print(f"   Rechercher : {correction['search']}")
        print(f"   Remplacer par : {correction['replace']}")
        
        # Compter les occurrences avant remplacement
        matches_before = len(re.findall(correction['search'], content))
        
        # Appliquer le remplacement
        content = re.sub(correction['search'], correction['replace'], content)
        
        # Compter les occurrences après remplacement
        matches_after = len(re.findall(correction['search'], content))
        
        if matches_before > 0:
            print(f"   ✅ {matches_before} occurrence(s) corrigée(s)")
        else:
            print(f"   ⚠️  Aucune occurrence trouvée")
    
    # Vérifier si des modifications ont été apportées
    if content == original_content:
        print("\n⚠️  Aucune modification n'a été apportée au fichier")
        return False
    
    # Écrire le fichier corrigé
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"\n✅ Fichier corrigé avec succès : {file_path}")
    return True

def verify_corrections(file_path):
    """Vérifier que toutes les corrections ont été appliquées"""
    print("\n🔍 VÉRIFICATION DES CORRECTIONS :")
    print("==================================")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Vérifier que les anciennes URLs n'existent plus
    old_patterns = [
        r'/patient/auto-mesures',
        r'/patient/\$\{patientId\}/auto-mesures/stats',
        r'/patient/\$\{patientId\}/auto-mesures/last'
    ]
    
    all_corrected = True
    for pattern in old_patterns:
        matches = re.findall(pattern, content)
        if matches:
            print(f"❌ Pattern incorrect trouvé : {pattern}")
            print(f"   Occurrences : {len(matches)}")
            all_corrected = False
        else:
            print(f"✅ Pattern incorrect non trouvé : {pattern}")
    
    # Vérifier que les nouvelles URLs existent
    new_patterns = [
        r'/patients/dmp/auto-mesures',
        r'/patients/\$\{patientId\}/dmp/auto-mesures/stats',
        r'/patients/\$\{patientId\}/dmp/auto-mesures/last'
    ]
    
    for pattern in new_patterns:
        matches = re.findall(pattern, content)
        if matches:
            print(f"✅ Nouveau pattern trouvé : {pattern}")
            print(f"   Occurrences : {len(matches)}")
        else:
            print(f"⚠️  Nouveau pattern non trouvé : {pattern}")
    
    return all_corrected

def main():
    """Fonction principale"""
    print("🚨 CORRECTION AUTOMATIQUE DES URLs AUTO-MESURES DMP")
    print("===================================================")
    print("")
    
    # Chemin du fichier à corriger
    file_path = "src/services/api/dmpApi.js"
    
    print(f"📁 Fichier cible : {file_path}")
    print("")
    
    # Corriger les URLs
    if correct_urls(file_path):
        print("\n✅ CORRECTION TERMINÉE AVEC SUCCÈS !")
        
        # Vérifier les corrections
        verify_corrections(file_path)
        
        print("\n🎯 RÉSULTAT ATTENDU :")
        print("=======================")
        print("✅ Plus d'erreur 404 sur les auto-mesures")
        print("✅ API auto-mesures complètement fonctionnelle")
        print("✅ Intégration frontend-backend opérationnelle")
        print("✅ Composant AutoMesuresWidget avec données réelles")
        
        print("\n🧪 PROCHAINES ÉTAPES :")
        print("=======================")
        print("1. Sauvegarder le fichier")
        print("2. Recharger l'application")
        print("3. Vérifier que l'erreur 404 est résolue")
        print("4. Tester le composant AutoMesuresWidget")
        
    else:
        print("\n❌ ÉCHEC DE LA CORRECTION")
        print("Vérifiez que le fichier existe et est accessible")

if __name__ == "__main__":
    main()
