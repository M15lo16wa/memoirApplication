import React from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticated } from "./authApi";

const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated()) {
        // Rediriger vers la page de login si non authentifié
        return <Navigate to="/connexion" replace />;
    }
    return children;
};

export default ProtectedRoute;