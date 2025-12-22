# Instructions de migration pour les champs LinkedIn

## Option 1 : Migration SQL manuelle (Recommandé - Plus sûr)

1. Ouvrez votre dashboard Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans "SQL Editor"
4. Copiez-collez le contenu du fichier `prisma/migrations/add_linkedin_fields.sql`
5. Cliquez sur "Run"

Cette migration est **100% sûre** et n'affecte pas les données existantes.

## Option 2 : Utiliser Prisma db push (Si MONTHLY n'est plus utilisé)

Si vous êtes sûr que la valeur `MONTHLY` dans l'enum `BillingPeriod` n'est plus utilisée dans votre base de données :

```bash
npm run db:push -- --accept-data-loss
```

⚠️ **Attention** : Cela peut supprimer des données si `MONTHLY` est encore utilisé quelque part.

## Option 3 : Ajouter MONTHLY à l'enum (Si encore utilisé)

Si `MONTHLY` est encore utilisé dans votre base, ajoutez-le temporairement au schéma :

```prisma
enum BillingPeriod {
  FOUR_WEEKS
  MONTHLY  // Ajouter cette ligne
  ANNUAL
}
```

Puis exécutez :
```bash
npm run db:push
```

## Vérification

Après la migration, vérifiez que les champs sont bien créés :

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name LIKE 'linkedin%';
```

Vous devriez voir :
- linkedinConnected
- linkedinAccessToken
- linkedinRefreshToken
- linkedinExpiresAt
- linkedinCookies
- linkedinLastUsed
- linkedinRequestCount
- linkedinLastReset
- linkedinRiskLevel
- linkedinBlockedUntil

Et la table `linkedin_cache` devrait exister.

