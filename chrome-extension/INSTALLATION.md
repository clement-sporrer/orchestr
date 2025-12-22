# 📥 Guide d'installation - Extension Chrome ORCHESTR

Guide complet pour installer et configurer l'extension Chrome ORCHESTR pour capturer les profils LinkedIn.

## 🎯 Prérequis

- Google Chrome (version 88 ou supérieure)
- Un compte ORCHESTR actif
- Accès à votre email de connexion ORCHESTR

## 📦 Installation

### Étape 1 : Télécharger l'extension

1. Clonez ou téléchargez le dépôt GitHub :
   ```bash
   git clone https://github.com/clement-sporrer/orchestr.git
   cd orchestr/chrome-extension
   ```

   Ou téléchargez directement le dossier `chrome-extension` depuis le dépôt.

### Étape 2 : Charger l'extension dans Chrome

1. **Ouvrez Chrome** et allez à l'adresse :
   ```
   chrome://extensions/
   ```
   
   Ou via le menu :
   - Cliquez sur les **3 points** (⋮) en haut à droite
   - Allez dans **Extensions** → **Gérer les extensions**

2. **Activez le Mode développeur** :
   - En haut à droite, activez le bouton **"Mode développeur"**

3. **Chargez l'extension** :
   - Cliquez sur **"Charger l'extension non empaquetée"**
   - Naviguez vers le dossier `chrome-extension` de votre projet
   - Sélectionnez le dossier et cliquez sur **"Sélectionner le dossier"**

4. **Vérification** :
   - L'extension ORCHESTR devrait apparaître dans la liste
   - Une icône ORCHESTR devrait apparaître dans la barre d'extensions Chrome

## ⚙️ Configuration

### Étape 1 : Ouvrir les paramètres

1. Cliquez sur l'icône **ORCHESTR** dans la barre d'extensions Chrome
2. Si c'est la première fois, vous verrez l'écran de configuration

### Étape 2 : Configurer l'URL de l'API

1. **URL de l'API** : Entrez l'URL de votre application ORCHESTR
   - En production : `https://votre-domaine.com` ou `https://orchestr.vercel.app`
   - En développement local : `http://localhost:3000`

   ⚠️ **Important** : N'ajoutez PAS de slash final (`/`)

   Exemples :
   - ✅ `https://orchestr.vercel.app`
   - ✅ `http://localhost:3000`
   - ❌ `https://orchestr.vercel.app/` (ne pas mettre de slash)

### Étape 3 : Configurer la clé API

1. **Clé API** : Entrez votre **email de connexion ORCHESTR**
   - C'est l'email que vous utilisez pour vous connecter à l'application
   - Exemple : `votre-email@exemple.com`

2. Cliquez sur **"Enregistrer"**

## ✅ Vérification

Pour vérifier que tout fonctionne :

1. Allez sur un profil LinkedIn (ex: `https://www.linkedin.com/in/nom-prenom`)
2. Cliquez sur l'icône ORCHESTR dans la barre d'extensions
3. Vous devriez voir :
   - ✅ Le nom du profil détecté
   - ✅ Un message "Profil détecté"
   - ✅ Une liste déroulante des missions actives
   - ✅ Un bouton "Capturer ce profil"

## 🚀 Utilisation

### Capturer un profil LinkedIn

1. **Naviguez vers un profil LinkedIn** :
   - Ouvrez n'importe quel profil LinkedIn dans votre navigateur
   - L'URL doit être de type : `https://www.linkedin.com/in/nom-prenom`

2. **Ouvrez l'extension** :
   - Cliquez sur l'icône ORCHESTR dans la barre d'extensions

3. **Sélectionnez une mission (optionnel)** :
   - Choisissez une mission dans la liste déroulante
   - Si aucune mission n'est sélectionnée, le candidat sera ajouté au vivier général

4. **Capturez le profil** :
   - Cliquez sur **"Capturer ce profil"**
   - Attendez quelques secondes
   - Vous verrez un message de confirmation avec le score du candidat (si ajouté à une mission)

### Fonctionnalités

- ✅ **Extraction automatique** : Nom, prénom, headline, localisation, expériences, formation, compétences, langues
- ✅ **Déduplication intelligente** : Les candidats existants sont mis à jour, pas dupliqués
- ✅ **Scoring automatique** : Si ajouté à une mission, le candidat est automatiquement scoré par l'IA
- ✅ **Ajout au vivier** : Sans mission, le candidat est ajouté au vivier global de votre organisation

## 🔧 Dépannage

### L'extension ne s'affiche pas

1. Vérifiez que le Mode développeur est activé dans `chrome://extensions/`
2. Vérifiez que l'extension est activée (bouton toggle)
3. Rechargez l'extension en cliquant sur l'icône de rechargement

### "Aucun profil détecté"

1. Assurez-vous d'être sur une page de profil LinkedIn (`/in/nom-prenom`)
2. Rechargez la page LinkedIn
3. Réessayez en cliquant sur l'icône de l'extension

### "Erreur de connexion à l'API"

1. Vérifiez que l'URL de l'API est correcte (sans slash final)
2. Vérifiez que vous êtes connecté à ORCHESTR dans un autre onglet
3. Vérifiez que votre email (clé API) est correct
4. Vérifiez la console du navigateur (F12) pour plus de détails

### "Non autorisé" ou "401 Unauthorized"

1. Vérifiez que votre email (clé API) correspond à votre compte ORCHESTR
2. Vérifiez que vous êtes bien connecté à ORCHESTR
3. Essayez de vous déconnecter et reconnecter à ORCHESTR

### Les missions ne s'affichent pas

1. Vérifiez que vous avez au moins une mission active dans ORCHESTR
2. Vérifiez que l'URL de l'API est correcte
3. Vérifiez que votre clé API (email) est correcte

## 🔄 Mise à jour

Pour mettre à jour l'extension :

1. Téléchargez la dernière version depuis GitHub
2. Allez dans `chrome://extensions/`
3. Cliquez sur l'icône de **rechargement** (↻) sur la carte de l'extension ORCHESTR

Vos paramètres (URL API et clé) seront conservés.

## 🗑️ Désinstallation

Pour désinstaller l'extension :

1. Allez dans `chrome://extensions/`
2. Trouvez l'extension ORCHESTR
3. Cliquez sur **"Supprimer"**

## 📝 Notes techniques

- **Manifest V3** : L'extension utilise la dernière version du manifest Chrome
- **Permissions** : L'extension nécessite uniquement l'accès aux pages LinkedIn et au stockage local
- **Données** : Aucune donnée n'est envoyée en dehors de votre instance ORCHESTR
- **Sécurité** : La clé API (email) est stockée localement dans Chrome, jamais partagée

## 🆘 Support

Si vous rencontrez des problèmes :

1. Vérifiez ce guide de dépannage
2. Consultez les logs de la console (F12 → Console)
3. Vérifiez que votre instance ORCHESTR est accessible
4. Contactez le support si le problème persiste

## 📚 Ressources

- [Documentation Chrome Extensions](https://developer.chrome.com/docs/extensions/)
- [Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Dépôt GitHub ORCHESTR](https://github.com/clement-sporrer/orchestr)

---

**Version** : 1.0.0  
**Dernière mise à jour** : 2024

