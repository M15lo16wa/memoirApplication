# Documentation du Flux 2FA Frontend - Setup2FA

## Vue d'ensemble

Le composant `Setup2FA` gère l'ensemble du processus d'authentification à double facteur (2FA) côté frontend, depuis la récupération du secret jusqu'à la validation finale. Il supporte deux flux distincts : la configuration initiale et la connexion avec 2FA existant.

## Architecture du Composant

### Props d'entrée
```javascript
function Setup2FA({ 
    onSetupComplete,      // Callback appelé après succès
    onCancel,            // Callback d'annulation
    userData,            // Données utilisateur (patient ou professionnel)
    isLoginFlow,         // Boolean indiquant si c'est un flux de connexion
    tempTokenId,         // Token temporaire pour la session 2FA
    generatedToken       // Token généré pour la validation
})
```

### États internes
```javascript
const [step, setStep] = useState('setup');           // 'setup', 'verify', 'success'
const [qrCodeData, setQrCodeData] = useState(null);  // Données du QR code
const [secret, setSecret] = useState('');            // Secret de configuration
const [loginSecret, setLoginSecret] = useState('');  // Secret existant pour connexion
const [verificationCode, setVerificationCode] = useState(''); // Code saisi par l'utilisateur
const [loading, setLoading] = useState(false);       // État de chargement
const [error, setError] = useState('');              // Messages d'erreur
```

## Flux de Récupération du Secret

### 1. Initialisation et Détection du Contexte

```javascript
useEffect(() => {
    if (!userData) return;
    
    // Flux de connexion avec 2FA déjà activé
    if (isLoginFlow && userData.two_factor_enabled && tempTokenId && generatedToken) {
        setLoginSecret(userData.two_factor_secret);
        setStep('verify');
        return;
    }
    
    // 2FA déjà configuré côté compte
    if (userData.two_factor_secret) {
        setLoginSecret(userData.two_factor_secret);
        setStep('verify');
        return;
    }
    
    // Configuration initiale
    initialize2FA();
}, [userData, initialize2FA, isLoginFlow, tempTokenId, generatedToken]);
```

### 2. Appel API de Configuration

La fonction `initialize2FA()` appelle l'API backend pour récupérer le secret :

```javascript
const initialize2FA = useCallback(async () => {
    try {
        setLoading(true);
        setError('');
        
        // Construction des paramètres selon le type d'utilisateur
        const params = (() => {
            if (userData.numero_assure) {
                return { 
                    userType: 'patient', 
                    identifier: userData.numero_assure, 
                    userId: String(userData.id_patient || userData.id || userData.userId)
                };
            }
            if (userData.numero_adeli) {
                return { 
                    userType: 'professionnel', 
                    identifier: userData.numero_adeli, 
                    userId: String(userData.id || userData.id_professionnel || userData.userId)
                };
            }
            // ... autres cas
        })();

        // Appel à l'API setup2FA
        const response = await setup2FA(params);
        
        if (response && response.status === 'success' && response.data) {
            const payload = response.data;
            
            // Extraction du secret
            const receivedSecret = payload.secret || payload.two_factor_secret || 
                                 payload.setupSecret || payload.totpSecret || '';
            setSecret(receivedSecret);
            
            // Extraction des données QR
            const qrFromServer = payload.qrCode || payload.qrCodeData || 
                                payload.totpUrl || payload.otpauthUrl || null;
            setQrCodeData(qrFromServer);
            
            setRecoveryCodes(payload.recoveryCodes || []);
            setStep('setup');
        }
    } catch (error) {
        // Gestion des erreurs
    } finally {
        setLoading(false);
    }
}, [userData, isLoginFlow, tempTokenId, generatedToken]);
```

## Affichage du QR Code

### 1. Rendu Conditionnel du QR

Le composant gère deux formats de QR code :

```javascript
const isImageQr = typeof qrCodeData === 'string' && qrCodeData.startsWith('data:image/');

// Dans le rendu
{step === 'setup' && (
    <div className="text-center">
        <div className="inline-block p-4 bg-gray-50 rounded-lg">
            {qrCodeData ? (
                <>
                    {isImageQr ? (
                        // QR code sous forme d'image base64
                        <img src={qrCodeData} alt="QR Code 2FA" className="mx-auto" width={200} height={200} />
                    ) : (
                        // QR code généré à partir d'URL ou secret
                        <QRCodeSVG value={qrCodeData} size={200} className="mx-auto" />
                    )}
                </>
            ) : (
                // Fallback si pas de QR
                <div className="p-8 text-gray-500 text-sm">
                    Le serveur n'a pas fourni d'image QR. Utilisez le secret ci-dessous.
                </div>
            )}
        </div>
        <p className="text-xs text-gray-600 mt-2">
            Secret (exact serveur): {secret || 'Non fourni'}
        </p>
    </div>
)}
```

### 2. Instructions Utilisateur

```javascript
<div className="bg-blue-50 p-4 rounded-lg">
    <h4 className="font-medium text-blue-900 mb-2">Instructions de configuration :</h4>
    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
        <li>Ouvrez votre application d'authentification (Google Authenticator, etc.).</li>
        <li>Si le QR est affiché, scannez-le. Sinon, ajoutez un compte avec le secret ci-dessus.</li>
        <li>Entrez le code à 6 chiffres généré ci-dessous pour valider.</li>
    </ol>
</div>
```

## Validation et Confirmation

### 1. Saisie du Code de Vérification

```javascript
{step === 'verify' && (
    <form onSubmit={handleVerification} className="space-y-4">
        {loginSecret && (
            <p className="text-xs text-gray-500">
                Mode vérification: votre compte a déjà un 2FA activé.
            </p>
        )}
        <div>
            <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2">
                Code de vérification
            </label>
            <input 
                type="text" 
                id="verificationCode" 
                value={verificationCode} 
                onChange={(e) => setVerificationCode(e.target.value)} 
                placeholder="123456" 
                maxLength="6" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                required 
            />
            <p className="text-xs text-gray-500 mt-1">
                Saisissez le code à 6 chiffres affiché dans votre application d'authentification
            </p>
        </div>
        <div className="flex space-x-3">
            <button type="button" onClick={() => setStep('setup')} className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors">
                Retour
            </button>
            <button type="submit" className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                Valider
            </button>
        </div>
    </form>
)}
```

### 2. Traitement de la Vérification

```javascript
const handleVerification = async (e) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length !== 6) {
        setError('Veuillez saisir un code à 6 chiffres');
        return;
    }
    
    try {
        setLoading(true);
        setError('');
        
        let verificationResult;
        
        if (isLoginFlow && tempTokenId && generatedToken) {
            // Flux de connexion : validation de session 2FA
            verificationResult = await validate2FASession(verificationCode, tempTokenId);
        } else {
            // Flux de configuration : activation du 2FA
            verificationResult = await verifyAndEnable2FA(verificationCode);
        }
        
        if (verificationResult && (verificationResult.success || verificationResult.status === 'success')) {
            // Gestion des tokens d'authentification
            if (isLoginFlow && verificationResult.data) {
                // Stockage des tokens selon le type d'utilisateur
                // ... logique de stockage
            }
            
            setStep('success');
            
            // Appel du callback de succès
            setTimeout(() => { 
                if (typeof onSetupComplete === 'function') {
                    onSetupComplete();
                }
            }, 1200);
        }
    } catch (error) {
        // Gestion des erreurs
    } finally {
        setLoading(false);
    }
};
```

## Gestion des Tokens d'Authentification

### 1. Stockage des Tokens Patients

```javascript
if (userData.type === 'patient' || userData.numero_assure) {
    let finalToken = null;
    
    if (apiJWT) {
        // Priorité absolue au JWT de l'API
        finalToken = apiJWT;
        localStorage.setItem('jwt', finalToken);
    } else if (userData.originalJWT) {
        // Fallback sur le JWT original
        finalToken = userData.originalJWT;
        localStorage.setItem('jwt', finalToken);
    }
    // ... autres fallbacks
    
    // Stockage des données patient mises à jour
    const patientData = {
        ...userData,
        ...authData.patient,
        ...authData.user,
        id_patient: userData.id_patient || userData.id || authData.patient?.id || authData.user?.id
    };
    localStorage.setItem('patient', JSON.stringify(patientData));
}
```

### 2. Stockage des Tokens Professionnels

```javascript
if (userData.type === 'professionnel' || userData.numero_adeli || userData.email) {
    let finalToken = null;
    
    if (apiJWT) {
        finalToken = apiJWT;
        localStorage.setItem('token', finalToken);
    } else if (userData.originalToken) {
        finalToken = userData.originalToken;
        localStorage.setItem('token', finalToken);
    }
    // ... autres fallbacks
    
    // Stockage selon le type de professionnel
    if (userData.numero_adeli) {
        localStorage.setItem('medecin', JSON.stringify(profData));
    }
}
```

## Gestion des Erreurs et États

### 1. États de Chargement

```javascript
if (loading) {
    return (
        <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Configuration en cours...</span>
        </div>
    );
}
```

### 2. Affichage des Erreurs

```javascript
{error && (
    <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r">
        <p className="text-sm">{error}</p>
    </div>
)}
```

### 3. Message de Succès

```javascript
if (step === 'success') {
    const isLoginSuccess = isLoginFlow && tempTokenId && generatedToken;
    const successTitle = isLoginSuccess ? 'Connexion 2FA réussie !' : 'Configuration 2FA réussie !';
    const successMessage = isLoginSuccess ? 
        'Vous êtes maintenant connecté avec votre authentification à double facteur.' : 
        'Votre authentification à double facteur est maintenant activée.';
    
    return (
        <div className="text-center p-8">
            <FaCheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{successTitle}</h3>
            <p className="text-gray-600">{successMessage}</p>
            <p className="text-xs text-gray-500 mt-2">Redirection en cours...</p>
        </div>
    );
}
```

## Flux Complet Résumé

1. **Initialisation** : Le composant détecte le contexte (configuration ou connexion)
2. **Récupération du Secret** : Appel API `setup2FA` pour obtenir le secret et le QR code
3. **Affichage du QR** : Rendu du QR code ou du secret selon le format reçu
4. **Configuration Utilisateur** : L'utilisateur configure son application d'authentification
5. **Validation** : Saisie et vérification du code à 6 chiffres
6. **Finalisation** : Stockage des tokens et appel du callback de succès

## Points Clés de Sécurité

- **Validation du code** : Vérification stricte du format 6 chiffres
- **Gestion des tokens** : Priorité aux tokens de l'API, fallbacks sécurisés
- **Séparation des flux** : Distinction claire entre configuration et connexion
- **Gestion d'erreurs** : Messages d'erreur informatifs sans exposition de données sensibles
- **Logs de débogage** : Traçage complet pour le diagnostic des problèmes

## Dépendances

- `qrcode.react` : Génération de QR codes côté client
- `react-icons/fa` : Icônes d'interface
- `twoFactorApi` : Service API pour les appels backend
- `localStorage` : Stockage des tokens d'authentification
