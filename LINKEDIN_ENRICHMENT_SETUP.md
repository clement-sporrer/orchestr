# Configuration de l'enrichissement LinkedIn automatique

Ce document explique comment configurer le système d'enrichissement LinkedIn automatique qui permet de remplir automatiquement les profils candidats depuis une URL LinkedIn.

## 🔒 Sécurité

Le système est conçu pour **protéger les comptes LinkedIn des utilisateurs** avec :

- ✅ **Limites conservatrices** : 30 requêtes/heure par compte (très en dessous des limites LinkedIn)
- ✅ **Détection de risque** : Arrêt automatique si LinkedIn détecte une activité suspecte
- ✅ **Rotation intelligente** : Distribution de la charge entre tous les comptes connectés
- ✅ **Cache agressif** : 7 jours de cache pour éviter les requêtes répétées
- ✅ **Délais respectueux** : 3 secondes minimum entre chaque requête
- ✅ **Chiffrement** : Tous les tokens LinkedIn sont chiffrés en base de données

## 📋 Prérequis

1. **Puppeteer** : Installé automatiquement avec `npm install`
2. **Variable d'environnement** : `ENCRYPTION_KEY` (clé de chiffrement 32 bytes en hex)

## 🔑 Configuration de la clé de chiffrement

Générez une clé de chiffrement sécurisée :

```bash
# Générer une clé de 32 bytes (64 caractères hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Ajoutez-la à votre fichier `.env` :

```env
ENCRYPTION_KEY=votre_cle_64_caracteres_hex
```

⚠️ **Important** : Cette clé doit être la même en production et ne jamais être changée une fois en production (sinon les données chiffrées seront perdues).

## 🗄️ Migration de la base de données

Exécutez la migration Prisma pour ajouter les nouveaux champs :

```bash
npm run db:migrate
```

Ou si vous utilisez `db:push` :

```bash
npm run db:push
```

## 🔗 Configuration LinkedIn OAuth (optionnel)

Pour utiliser l'API LinkedIn officielle en complément du scraping :

1. Créez une application LinkedIn sur [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Configurez les redirect URIs : `https://votre-domaine.com/api/auth/linkedin/callback`
3. Ajoutez les variables d'environnement :

```env
LINKEDIN_CLIENT_ID=votre_client_id
LINKEDIN_CLIENT_SECRET=votre_client_secret
```

## 🚀 Utilisation

### Pour les utilisateurs

1. **Connecter un compte LinkedIn** (dans les paramètres)
2. **Ajouter un candidat** : Coller l'URL LinkedIn → Le profil est rempli automatiquement
3. **Vérifier et compléter** : Les données sont pré-remplies, l'utilisateur peut modifier

### Pour les administrateurs

Le système gère automatiquement :
- La rotation entre les comptes connectés
- La détection de risque et l'arrêt automatique
- Le cache pour éviter les requêtes répétées
- Les limites de sécurité par compte

## 📊 Monitoring

Le système enregistre :
- Le nombre de requêtes par compte/heure
- Le niveau de risque de chaque compte
- Les erreurs et blocages détectés

## ⚠️ Limitations de sécurité

Pour protéger les comptes utilisateurs :

- **30 requêtes/heure maximum** par compte LinkedIn
- **3 secondes minimum** entre chaque requête
- **Blocage automatique** si LinkedIn détecte une activité suspecte
- **Arrêt immédiat** en cas d'erreur d'authentification

## 🔄 Fallback

Si le scraping automatique n'est pas disponible :
1. L'utilisateur peut utiliser l'**extension Chrome** (déjà implémentée)
2. L'utilisateur peut **copier-coller** le contenu du profil LinkedIn
3. L'utilisateur peut **remplir manuellement**

## 🛠️ Dépannage

### "Aucune session LinkedIn disponible"

- Connectez plus de comptes LinkedIn dans les paramètres
- Attendez quelques minutes (limite horaire)
- Utilisez l'extension Chrome ou le copier-coller

### "LinkedIn a détecté une activité suspecte"

- Le compte est temporairement bloqué (30 min à 1h)
- Utilisez l'extension Chrome ou le copier-coller
- Le système se débloquera automatiquement après la période de blocage

### Erreurs de scraping

- Vérifiez que Puppeteer est installé : `npm list puppeteer`
- Vérifiez les logs serveur pour plus de détails
- Utilisez l'extension Chrome comme fallback

## 📈 Performance

Avec cette configuration :
- **2 comptes LinkedIn** = ~60 requêtes/heure
- **10 comptes LinkedIn** = ~300 requêtes/heure
- **20 comptes LinkedIn** = ~600 requêtes/heure

Avec le cache (7 jours), le débit réel peut être bien supérieur si beaucoup de profils sont déjà en cache.

