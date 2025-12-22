# 🚀 Guide de démarrage rapide - Enrichissement LinkedIn

## ✅ Ce qui est déjà configuré

- ✅ **ENCRYPTION_KEY** : Configurée dans `.env`
- ✅ **Puppeteer** : Installé
- ✅ **Client Prisma** : Généré avec les nouveaux champs
- ✅ **Code** : Tous les services sont en place

## 📋 Dernière étape : Migration SQL

**Vous devez exécuter la migration SQL dans Supabase** pour créer les champs LinkedIn dans la base de données.

### Option 1 : Via Supabase Dashboard (Recommandé)

1. Ouvrez https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **"SQL Editor"** (menu de gauche)
4. Cliquez sur **"New query"**
5. **Copiez-collez** le contenu de `prisma/migrations/add_linkedin_fields.sql`
6. Cliquez sur **"Run"** (ou Cmd/Ctrl + Enter)

### Option 2 : Via psql (si installé)

```bash
psql $DATABASE_URL < prisma/migrations/add_linkedin_fields.sql
```

### Vérification

Après la migration, vérifiez que tout est OK :

```sql
-- Vérifier les colonnes LinkedIn dans users
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name LIKE 'linkedin%';

-- Vérifier la table de cache
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'linkedin_cache';
```

Vous devriez voir :
- 10 colonnes LinkedIn dans `users`
- 1 table `linkedin_cache`

## 🎯 Utilisation

Une fois la migration exécutée :

1. **Connecter un compte LinkedIn** :
   - Allez dans `/settings`
   - Section "Intégration LinkedIn"
   - Cliquez sur "Connecter mon compte LinkedIn"

2. **Enrichir un profil** :
   - Allez dans `/candidates/new`
   - Collez une URL LinkedIn
   - Le profil est rempli automatiquement ! 🎉

## ⚙️ Configuration optionnelle : LinkedIn OAuth

Si vous voulez utiliser l'API LinkedIn officielle (en complément du scraping) :

1. Créez une app sur https://www.linkedin.com/developers/
2. Configurez le redirect URI : `https://votre-domaine.com/api/auth/linkedin/callback`
3. Ajoutez dans `.env` :
   ```env
   LINKEDIN_CLIENT_ID=votre_client_id
   LINKEDIN_CLIENT_SECRET=votre_client_secret
   ```

**Note** : L'OAuth est optionnel. Le scraping fonctionne sans, mais nécessite que l'utilisateur soit connecté à LinkedIn dans son navigateur lors de la première utilisation.

## 🔒 Sécurité

Le système protège automatiquement les comptes avec :
- ✅ 30 requêtes/heure maximum par compte
- ✅ 3 secondes minimum entre chaque requête
- ✅ Détection automatique de risque
- ✅ Blocage automatique si LinkedIn détecte un problème

## 🐛 Dépannage

### "Aucune session LinkedIn disponible"
→ Connectez au moins un compte LinkedIn dans `/settings`

### "LinkedIn a détecté une activité suspecte"
→ Le compte est temporairement bloqué (30 min - 1h). Utilisez l'extension Chrome ou copiez-collez le contenu.

### Erreurs de scraping
→ Vérifiez les logs serveur. Utilisez l'extension Chrome comme fallback.

## 📊 Performance

- **2 comptes LinkedIn** = ~60 requêtes/heure
- **10 comptes LinkedIn** = ~300 requêtes/heure
- **20 comptes LinkedIn** = ~600 requêtes/heure

Avec le cache (7 jours), le débit réel peut être bien supérieur !

