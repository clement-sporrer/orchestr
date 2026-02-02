# ORCHESTR v2.0 – État de fonctionnalité

**Réponse courte :** Non, le produit n’est pas encore **parfaitement et complètement** fonctionnel au sens PRD v2.0. Le build passe et les parties déjà adaptées marchent, mais il manque la migration DB, quelques écrans et le pipeline simplifié.

---

## ✅ Ce qui est en place et fonctionnel

- **Build** : `npm run build` réussit (Next.js + TypeScript).
- **Navigation PRD v2** : Dashboard, Clients, Missions, Candidats, Settings (Pools, Tasks, Import retirés).
- **Settings** : Billing, Calendly, Extension masqués ; listes domains / sectors / jobFamilies en base et dans l’UI Organisation.
- **Clients** : Liste, détail, création, édition avec **companyName** (MAJ), **category** (liste), recherche ; formulaire nouveau client avec catégories depuis Settings.
- **Contacts** : **firstName**, **lastName**, **title**, **email** obligatoire, **isPrimary** ; formulaire + affichage "★ Principal" ; un seul contact principal par client.
- **Missions** : Création avec **mainContact** (select contacts du client) ; détail mission affiche client (companyName), contact principal, ville/pays si renseignés.
- **OrganizationSettings** : **clientCategories**, **contractTypes**, **seniorities** en schéma Prisma + actions (get/update/reset) ; utilisés dans formulaire client (catégorie).
- **Export candidats** : `exportCandidatesCsv` + bouton export existants.

---

## ❌ Ce qui bloque ou manque pour “complet PRD v2”

### 1. Migration base de données (bloquant)

- Le **schéma Prisma** a été mis à jour (Organization.slug, OrganizationSettings listes, Client companyName/category, Contact firstName/lastName/isPrimary, Mission mainContact + champs PRD, MissionCandidate notes/dates, 4 modèles Document).
- La **migration n’a pas été appliquée** (échec sur shadow DB / anciennes migrations).
- **Conséquence** : Sur une base réelle, les nouvelles colonnes/tables n’existent pas → erreurs au runtime (create/update client, contact, mission, etc.).
- **À faire** : Corriger ou repartir des migrations, puis exécuter `npx prisma migrate dev` (ou équivalent) pour appliquer le schéma Phase 1.

### 2. Page “Modifier la mission” (404)

- Le lien **Modifier** sur une mission pointe vers `/missions/[id]/edit`.
- Cette route **n’existe pas** → 404.
- **À faire** : Créer `app/(dashboard)/missions/[id]/edit/page.tsx` (ou rediriger vers un modal/onglet édition sur la page détail).

### 3. Settings – Nouvelles listes PRD non gérées dans l’UI

- **clientCategories**, **contractTypes**, **seniorities** sont en base et utilisés (ex. catégorie client).
- La page **Paramètres → Organisation** n’affiche et ne gère que domains, sectors, jobFamilies.
- **À faire** : Ajouter dans l’UI Settings (onglets ou sections) la gestion des listes : Catégories clients, Types de contrat, Séniorités (ajout/suppression/réinitialisation comme pour les autres listes).

### 4. Pipeline 6 étapes (PRD)

- Aujourd’hui : **10 étapes** (SOURCED → … → CLOSED_HIRED / CLOSED_REJECTED) + score, portail.
- PRD v2 : **6 étapes** SOURCED → CONTACTED → INTERVIEW → SENT → HIRED / REJECTED, sans scoring ni portail.
- **À faire** : Soit réduire l’enum/statuts en base + migration des données, soit garder la base actuelle et faire un **mapping visuel** (afficher 6 colonnes Kanban en regroupant les étapes). Puis retirer/neutraliser score et portail dans l’UI.

### 5. Documents (PRD)

- Les **4 modèles** (ClientDocument, MissionDocument, CandidateDocument, CandidateMissionDocument) sont dans le schéma.
- Aucune **UI d’upload** ni **actions dédiées** (upload/liste/suppression) pour ces documents.
- **À faire** : Implémenter upload (ex. Supabase Storage), actions serveur et blocs “Documents” sur les pages Client, Mission, Candidat et détail candidature.

### 6. Autres écarts PRD (non bloquants pour “fonctionnel de base”)

- **Dashboard** : Pas encore aligné sur les widgets PRD (missions actives, total candidats, clients actifs, entretiens en cours, missions récentes, actions rapides).
- **Mission** : Formulaire création/édition pas encore plein PRD (jobFamily, city/country/isRemote, priority, salaryNotes, deadline, etc.) ; détail mission affiche déjà une partie des champs.
- **Candidats** : Filtres et détail déjà présents ; autocomplete entreprise/poste et format langues PRD à vérifier/compléter si besoin.

---

## Synthèse

| Critère                         | Statut        |
|---------------------------------|---------------|
| Build / compile                 | ✅ OK         |
| Nav & périmètre v2 (sans Pools/Tasks/Import/Billing/Extension) | ✅ OK |
| Clients (companyName, category) | ✅ OK (sous réserve migration) |
| Contacts (firstName, lastName, isPrimary, email obligatoire) | ✅ OK (sous réserve migration) |
| Missions (mainContact, affichage détail) | ✅ OK (sous réserve migration) |
| Migration DB appliquée          | ❌ Non        |
| Édition mission                 | ❌ Route manquante |
| Settings (clientCategories, contractTypes, seniorities) | ⚠️ Backend OK, UI manquante |
| Pipeline 6 étapes              | ❌ Non fait   |
| Documents (upload + UI)        | ❌ Non fait   |

**En l’état** : le produit est **partiellement fonctionnel** pour un usage “light” (clients, contacts, missions avec mainContact) **dès que la migration Phase 1 sera appliquée**. Pour être **complet et aligné PRD v2**, il reste : migration, page édition mission, Settings listes PRD, pipeline 6 colonnes, et documents.
