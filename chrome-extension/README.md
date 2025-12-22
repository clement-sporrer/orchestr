# ORCHESTR - Extension Chrome LinkedIn

Extension Chrome pour capturer les profils LinkedIn directement dans votre base ORCHESTR.

## Installation

1. Ouvrez Chrome et allez dans `chrome://extensions/`
2. Activez le "Mode développeur" en haut à droite
3. Cliquez sur "Charger l'extension non empaquetée"
4. Sélectionnez le dossier `chrome-extension`

## Configuration

1. Cliquez sur l'icône ORCHESTR dans la barre d'extensions
2. Entrez l'URL de votre application (ex: `https://orchestr.vercel.app`)
3. Entrez votre email de connexion ORCHESTR comme clé API
4. Cliquez sur "Enregistrer"

## Utilisation

1. Naviguez vers un profil LinkedIn
2. Cliquez sur l'icône ORCHESTR
3. Sélectionnez optionnellement une mission cible
4. Cliquez sur "Capturer ce profil"

## Fonctionnalités

- **Extraction automatique** : Nom, headline, expériences, formation, compétences
- **Déduplication** : Les candidats existants sont mis à jour, pas dupliqués
- **Ajout à mission** : Ajoutez directement le candidat à une mission avec scoring automatique
- **Vivier global** : Sans mission sélectionnée, le candidat va dans le vivier général

## Icônes

Remplacez les fichiers dans le dossier `icons/` par vos propres icônes :
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

## Développement

L'extension utilise Manifest V3 et comprend :
- `manifest.json` : Configuration de l'extension
- `popup.html/js` : Interface utilisateur
- `content.js` : Script d'extraction des données LinkedIn
- `background.js` : Service worker

