# 📥 ORCHESTR - Extension Chrome LinkedIn

Extension Chrome gratuite pour capturer les profils LinkedIn directement dans votre base ORCHESTR.

## 🚀 Démarrage rapide

1. **Installez l'extension** : Suivez le [guide d'installation complet](./INSTALLATION.md)
2. **Configurez** : Entrez l'URL de votre API et votre email
3. **Utilisez** : Cliquez sur l'icône ORCHESTR sur n'importe quel profil LinkedIn

## ✨ Fonctionnalités

- ✅ **100% gratuit** - Pas de connexion OAuth nécessaire
- ✅ **Extraction automatique** : Nom, headline, expériences, formation, compétences, langues
- ✅ **Déduplication intelligente** : Les candidats existants sont mis à jour, pas dupliqués
- ✅ **Scoring automatique** : Si ajouté à une mission, scoring par IA
- ✅ **Ajout au vivier** : Sans mission, ajout au vivier global

## 📚 Documentation

- **[Guide d'installation complet](./INSTALLATION.md)** - Installation détaillée étape par étape
- **[Guide dans l'application](../src/app/(dashboard)/settings/extension/page.tsx)** - Interface web avec instructions

## 🔧 Configuration

### Paramètres requis

1. **URL de l'API** : L'URL de votre instance ORCHESTR
   - Production : `https://votre-domaine.com`
   - Local : `http://localhost:3000`
   - ⚠️ Sans slash final

2. **Clé API** : Votre email de connexion ORCHESTR
   - L'email que vous utilisez pour vous connecter à l'application

## 📖 Utilisation

1. Naviguez vers un profil LinkedIn (`linkedin.com/in/nom-prenom`)
2. Cliquez sur l'icône ORCHESTR dans la barre d'extensions
3. Sélectionnez une mission (optionnel)
4. Cliquez sur "Capturer ce profil"

## 🛠️ Structure technique

- **Manifest V3** : Dernière version du manifest Chrome
- `manifest.json` : Configuration de l'extension
- `popup.html/js` : Interface utilisateur
- `content.js` : Script d'extraction des données LinkedIn
- `background.js` : Service worker

## 🎨 Personnalisation

### Icônes

Remplacez les fichiers dans `icons/` :
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

## 🔒 Sécurité

- ✅ Aucune donnée n'est envoyée en dehors de votre instance ORCHESTR
- ✅ La clé API (email) est stockée localement dans Chrome
- ✅ Permissions minimales : uniquement LinkedIn et stockage local

## 🆘 Support

Consultez le [guide d'installation](./INSTALLATION.md) pour le dépannage détaillé.

## 📝 Version

**Version actuelle** : 1.0.0



