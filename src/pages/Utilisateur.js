import React, { useEffect, useState } from "react";

// Rôles possibles
const ROLES = ["patient", "utilisateur", "medecin"];

function Utilisateurs() {
    // État pour la liste des utilisateurs
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // État pour le formulaire de création
    const [form, setForm] = useState({
        nom: "",
        prenom: "",
        email: "",
        role: ROLES[0],
        password: "",
        confirmPassword: "",
    });
    const [formError, setFormError] = useState("");
    const [formSuccess, setFormSuccess] = useState("");
    const [creating, setCreating] = useState(false);

    // Récupération des utilisateurs depuis l'API
    useEffect(() => {
        setLoading(true);
        setError(null);
        fetch("/api/utilisateurs")
            .then(res => {
                if (!res.ok) throw new Error("Erreur lors du chargement des utilisateurs");
                return res.json();
            })
            .then(data => {
                setUsers(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    // Gestion du changement de rôle
    const handleRoleChange = (id, newRole) => {
        setUsers(users => users.map(user => user.id === id ? { ...user, role: newRole } : user));
        // TODO: Appeler l'API pour mettre à jour le rôle si besoin
    };

    // Gestion de l'activation/désactivation
    const handleActivationToggle = (id) => {
        setUsers(users => users.map(user => user.id === id ? { ...user, actif: !user.actif } : user));
        // TODO: Appeler l'API pour mettre à jour le statut si besoin
    };

    // Gestion du formulaire de création
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm(f => ({ ...f, [name]: value }));
        setFormError("");
        setFormSuccess("");
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!form.nom || !form.prenom || !form.email || !form.password || !form.confirmPassword) {
            setFormError("Tous les champs sont obligatoires.");
            return;
        }
        if (form.password !== form.confirmPassword) {
            setFormError("Les mots de passe ne correspondent pas.");
            return;
        }
        setCreating(true);
        setFormError("");
        setFormSuccess("");
        try {
            const res = await fetch("/api/utilisateurs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nom: form.nom,
                    prenom: form.prenom,
                    email: form.email,
                    role: form.role,
                    password: form.password
                })
            });
            if (!res.ok) throw new Error("Erreur lors de la création de l'utilisateur");
            const newUser = await res.json();
            setUsers([newUser, ...users]);
            setForm({ nom: "", prenom: "", email: "", role: ROLES[0], password: "", confirmPassword: "" });
            setFormSuccess("Utilisateur créé avec succès !");
        } catch (err) {
            setFormError(err.message);
        } finally {
            setCreating(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-40 text-lg font-semibold text-blue-600">Chargement des utilisateurs...</div>;
    if (error) return <div className="text-red-600 font-semibold">Erreur : {error}</div>;

    return (
        <div className="p-2 sm:p-4 md:p-6 max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-6 text-blue-700">Gestion des utilisateurs</h2>

            {/* Formulaire de création de compte */}
            <form onSubmit={handleFormSubmit} className="mb-8 sm:mb-10 bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100">
                <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-700">Créer un nouvel utilisateur</h3>
                {formError && <div className="text-red-600 mb-3 font-medium text-sm">{formError}</div>}
                {formSuccess && <div className="text-green-600 mb-3 font-medium text-sm">{formSuccess}</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold mb-1 text-gray-700">Nom</label>
                        <input type="text" name="nom" value={form.nom} onChange={handleFormChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs sm:text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold mb-1 text-gray-700">Prénom</label>
                        <input type="text" name="prenom" value={form.prenom} onChange={handleFormChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs sm:text-sm" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs sm:text-sm font-semibold mb-1 text-gray-700">Email</label>
                        <input type="email" name="email" value={form.email} onChange={handleFormChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs sm:text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold mb-1 text-gray-700">Rôle</label>
                        <select name="role" value={form.role} onChange={handleFormChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs sm:text-sm">
                            {ROLES.map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold mb-1 text-gray-700">Mot de passe</label>
                        <input type="password" name="password" value={form.password} onChange={handleFormChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs sm:text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold mb-1 text-gray-700">Confirmer le mot de passe</label>
                        <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleFormChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs sm:text-sm" />
                    </div>
                </div>
                <button type="submit" disabled={creating} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 rounded-lg font-semibold shadow transition text-sm sm:text-base disabled:opacity-60">{creating ? "Création..." : "Créer le compte"}</button>
            </form>

            <div className="overflow-x-auto rounded-xl shadow border border-gray-100 bg-white">
                <table className="min-w-[600px] w-full divide-y divide-gray-200 text-xs sm:text-sm">
                    <thead className="bg-blue-50">
                        <tr>
                            <th className="py-3 px-4 text-left font-bold text-blue-700 uppercase tracking-wider">Nom</th>
                            <th className="py-3 px-4 text-left font-bold text-blue-700 uppercase tracking-wider">Prénom</th>
                            <th className="py-3 px-4 text-left font-bold text-blue-700 uppercase tracking-wider">Email</th>
                            <th className="py-3 px-4 text-left font-bold text-blue-700 uppercase tracking-wider">Rôle</th>
                            <th className="py-3 px-4 text-left font-bold text-blue-700 uppercase tracking-wider">Statut</th>
                            <th className="py-3 px-4 text-center font-bold text-blue-700 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map((user, idx) => (
                            <tr key={user.id} className={idx % 2 === 0 ? "bg-white" : "bg-blue-50/50"}>
                                <td className="py-2 px-4 whitespace-nowrap">{user.nom}</td>
                                <td className="py-2 px-4 whitespace-nowrap">{user.prenom}</td>
                                <td className="py-2 px-4 whitespace-nowrap">{user.email}</td>
                                <td className="py-2 px-4 whitespace-nowrap">
                                    <select
                                        value={user.role}
                                        onChange={e => handleRoleChange(user.id, e.target.value)}
                                        className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs sm:text-sm"
                                    >
                                        {ROLES.map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="py-2 px-4 whitespace-nowrap">
                                    {user.actif ? (
                                        <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-700">Actif</span>
                                    ) : (
                                        <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-700">Inactif</span>
                                    )}
                                </td>
                                <td className="py-2 px-4 whitespace-nowrap text-center">
                                    <button
                                        onClick={() => handleActivationToggle(user.id)}
                                        className={`px-3 sm:px-4 py-1 rounded-lg font-semibold shadow-sm transition text-white text-xs sm:text-sm ${user.actif ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}`}
                                    >
                                        {user.actif ? "Désactiver" : "Activer"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Utilisateurs;