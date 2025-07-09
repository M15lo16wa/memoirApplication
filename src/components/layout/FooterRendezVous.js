import React from "react";

function FooterRendezVous() {
    return (
        <footer className="bg-gray-800 text-white mt-12 py-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-lg font-semibold mb-4">SantéSénégal</h3>
                        <p className="text-gray-300">Plateforme de santé numérique<br />Dakar, Sénégal</p>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Contact</h3>
                        <p className="text-gray-300">Téléphone: 77 167 47 10<br />Urgences: 15</p>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Horaires</h3>
                        <p className="text-gray-300">Lun-Ven: 8h-20h<br />Sam: 9h-13h<br />Urgences 24h/24</p>
                    </div>
                </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400 text-sm">
              <p>© 2025 SantéSénégal. Tous droits réservés.</p>
            </div>
      </footer>
    );
}

export default FooterRendezVous;