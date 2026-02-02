# ORCHESTR v2.0 – Analyse des écarts (PRD vs code actuel)

Ce document compare le **PRD v2.0** avec l’état actuel du code (MVP 1) et décrit les changements à apporter pour aligner le produit sur la vision v2.0 : **1 utilisateur, gestion manuelle optimisée, zéro complexité**.

---

## 1. Résumé exécutif

| Dimension | Actuel (MVP 1) | Cible (PRD v2.0) |
|-----------|----------------|-------------------|
| **Utilisateurs** | Multi-user (User, rôles, recruiterId) | 1 user principal, mono-tenant |
| **Auth** | Supabase Auth + User en DB | Supabase Auth uniquement (1 org = 1 user) |
| **Billing** | Stripe, Subscription, plans | ❌ Exclu |
| **Clients** | `name`, `sector` | `companyName` (MAJ), `category` (liste Settings) |
| **Contacts** | `name`, email optionnel | `firstName`, `lastName`, `email` obligatoire, `isPrimary` |
| **Missions** | 10+ champs visibilité, Calendly, scoreThreshold, recruiterId | Simplifié : jobTitle, client, mainContact, status (OPEN/ON_HOLD/FILLED/CANCELLED), priority |
| **Pipeline** | 10 étapes + ContactStatus + score + portal | 6 étapes : SOURCED → CONTACTED → INTERVIEW → SENT → HIRED / REJECTED |
| **Portails** | Candidate portal, Client portal, tokens | ❌ Exclu |
| **Documents** | Pas de tables dédiées (Candidate.files[]) | ClientDocument, MissionDocument, CandidateDocument, CandidateMissionDocument |
| **Settings** | domains, sectors, jobFamilies | + clientCategories, contractTypes, seniorities (listes string) |
| **Extensions** | Chrome extension, LinkedIn OAuth, enrichment | ❌ Exclu |
| **Analytics** | Event, analytics actions | Métriques simples Dashboard uniquement |

---

## 2. Schéma de données – Delta détaillé

### 2.1 Organization

| Champ PRD v2.0 | Actuel | Action |
|----------------|--------|--------|
| `id`, `name`, `slug` | `id`, `name` (pas de slug) | **Ajouter** `slug` @unique. Optionnel : retirer champs non PRD. |
| — | `logo`, `contactEmail`, `defaultCalendlyLink`, `retentionDaysIgnored`, `retentionDaysActive`, `onboardingCompleted` | **Conserver** pour compatibilité ou retirer si nettoyage total. |

### 2.2 OrganizationSettings

| Champ PRD v2.0 | Actuel | Action |
|----------------|--------|--------|
| `domains`, `sectors`, `jobFamilies` | ✅ Présents | Garder. |
| `clientCategories` | ❌ | **Ajouter** `String[]` (ex. Loueur, Établissement Financier). |
| `contractTypes` | ❌ | **Ajouter** `String[]` (CDI, CDD, Freelance, Stage, Alternance). |
| `seniorities` | ❌ | **Ajouter** `String[]` (1-5 ans, 5-10 ans, 10-20 ans, 20+ ans). |

Valeurs par défaut à aligner sur le PRD (voir section Listes configurables).

### 2.3 Client

| Champ PRD v2.0 | Actuel | Action |
|----------------|--------|--------|
| `companyName` | `name` | **Renommer** `name` → `companyName` (transformation MAJ côté app). |
| `category` | `sector` | **Renommer** ou réutiliser `sector` comme "catégorie" (liste depuis Settings). |
| `website`, `notes` | `website`, `notes` | OK. |
| — | — | **Ajouter** index sur `companyName` si pas déjà. |

### 2.4 Contact

| Champ PRD v2.0 | Actuel | Action |
|----------------|--------|--------|
| `firstName`, `lastName` | `name` | **Remplacer** `name` par `firstName` + `lastName` (capitalisation / MAJ côté app). |
| `title` | `role` | **Renommer** `role` → `title` (ou garder `role` et documenter équivalence). |
| `email` obligatoire | `email` optionnel | **Rendre** `email` obligatoire. |
| `phone` | `phone` | OK. |
| `isPrimary` | ❌ | **Ajouter** `Boolean @default(false)`. |
| Relation `missionsAsMain` | ❌ | **Ajouter** `Mission[]` avec `mainContactId` sur Mission. |

### 2.5 Mission

| Champ PRD v2.0 | Actuel | Action |
|----------------|--------|--------|
| `clientId`, `mainContactId` | `clientId`, pas de mainContact | **Ajouter** `mainContactId` (FK Contact). |
| `jobTitle` | `title` | **Renommer** `title` → `jobTitle`. |
| `jobFamily` (string) | — | **Ajouter** (liste Settings). |
| `city`, `country`, `isRemote` | `location` (string) | **Remplacer** par `city`, `country`, `isRemote`. |
| `seniority` (string) | `seniority` (enum Seniority) | **Remplacer** enum par String (liste Settings). |
| `languages` (Json) | ❌ | **Ajouter** `Json?` [{lang, level}]. |
| `domain`, `sector` (string) | — | **Ajouter** (listes Settings). |
| `salaryMin`, `salaryMax`, `salaryNotes` | idem sans salaryNotes | **Ajouter** `salaryNotes`. |
| `contractType` (string) | `contractType` (enum) | Passer en String (liste Settings). |
| `context`, `responsibilities`, `mustHave`, `niceToHave`, `redFlags`, `internalNotes` | Présents avec champs visibility | **Simplifier** : retirer champs visibility, garder contenus. |
| `recruitmentProcess` | `process` | Garder ou renommer. |
| `status` (OPEN/ON_HOLD/FILLED/CANCELLED) | MissionStatus (DRAFT/ACTIVE/…) | **Aligner** enum ou string sur PRD. |
| `priority` (LOW/MEDIUM/HIGH/URGENT) | ❌ | **Ajouter**. |
| `startDate`, `deadline` | `shortlistDeadline` | **Ajouter** `startDate`, renommer/ajuster deadline. |
| — | `recruiterId`, `calendlyLink`, `calendlyEmbed`, `scoreThreshold`, visibility | **Retirer** (hors périmètre v2.0). |
| Relation `documents` | ❌ | **Ajouter** après création modèle MissionDocument. |

### 2.6 Candidate

Globalement aligné avec le PRD. Ajustements :

| Champ PRD v2.0 | Actuel | Action |
|----------------|--------|--------|
| `recruitable` (YES/NO/"") | `recruitable` (enum RecruitableStatus) | Garder enum ou passer en String nullable. |
| `languages` (Json) | `languages` (Json) | Vérifier format [{lang, level}]. |
| — | `relationshipLevel`, `tags`, `status`, `consent*`, `mergedFromIds`, `files[]` | Décider : garder pour compatibilité ou simplifier (PRD ne les détaille pas). |
| — | `profileUrl`, `cvUrl`, `location`, `estimatedSeniority`, `estimatedSector`, `notes` | Legacy : à supprimer ou garder en lecture seule. |
| Documents | `files` (String[]) | **Migrer** vers modèle CandidateDocument + Supabase Storage. |

Supprimer pour v2.0 : **CandidateEnrichment**, **CandidatePosition** (taxonomie), **CandidatePool** si Pools exclus.

### 2.7 Pipeline (MissionCandidate → CandidateMission PRD)

| PRD v2.0 (CandidateMission) | Actuel (MissionCandidate) | Action |
|------------------------------|---------------------------|--------|
| `status` : SOURCED, CONTACTED, INTERVIEW, SENT, HIRED, REJECTED | `stage` : 10 valeurs PipelineStage | **Réduire** à 6 statuts (nouvel enum ou string). |
| `internalNotes`, `clientFeedback` | Pas de champs dédiés (interactions?) | **Ajouter** champs texte. |
| `contactedAt`, `interviewDate`, `sentToClientAt`, `hiredAt`, `rejectedAt`, `rejectionReason` | `rejectedAt`, `rejectionReason` | **Ajouter** champs date + remplir sur transition. |
| Relation `documents` | ❌ | **Ajouter** CandidateMissionDocument. |
| — | `contactStatus`, `score`, `scoreReasons`, `portalToken`, `portalTokenExpiry`, `portalCompleted`, `portalStep` | **Retirer** (portails, scoring exclus). |

Mapping stages actuels → PRD :

- SOURCED → SOURCED  
- CONTACTED → CONTACTED  
- RESPONSE_RECEIVED, INTERVIEW_SCHEDULED, INTERVIEW_DONE → INTERVIEW  
- SENT_TO_CLIENT → SENT  
- CLIENT_INTERVIEW, OFFER → à fusionner en SENT ou INTERVIEW selon usage  
- CLOSED_HIRED → HIRED  
- CLOSED_REJECTED → REJECTED  

### 2.8 Documents (nouveaux modèles)

À créer conformément au PRD :

1. **ClientDocument** : clientId, fileName, fileUrl, fileType, fileSize, createdAt.  
2. **MissionDocument** : missionId, documentType (PROPOSAL, CONTRACT, JOB_DESC, PRESENTATION, OTHER), fileName, fileUrl, fileType, fileSize.  
3. **CandidateDocument** : candidateId, fileName, fileUrl, fileType, fileSize.  
4. **CandidateMissionDocument** : candidateMissionId, documentType (INTERNAL_REPORT, CLIENT_REPORT, OTHER), fileName, fileUrl, fileType, fileSize.

Stockage : Supabase Storage ; chemins du type `/{organizationId}/clients|missions|candidates|candidate-missions/...`.

### 2.9 Modèles / fonctionnalités à retirer ou ne pas exposer (v2.0)

- **Subscription** (Stripe)  
- **User** (multi-user) : garder éventuellement 1 user par org pour auth, sans rôles ni assignation.  
- **TaxonomyPole**, **TaxonomyPosition**, **CandidatePosition**  
- **CandidateEnrichment**, **LinkedInCache**  
- **Pool**, **CandidatePool** (ou garder en interne sans UI si utile plus tard).  
- **Interaction** (remplacé par notes + dates sur CandidateMission).  
- **Task**, **MessageTemplate**  
- **Questionnaire**, **QuestionnaireQuestion**, **QuestionnaireResponse**, **QuestionnaireAnswer**  
- **Interview** (transcription, etc. exclue) : à retirer ou réduire à un simple “date entretien” sur CandidateMission.  
- **ReportTemplate**  
- **Shortlist**, **ShortlistCandidate**, **ClientFeedback** (portails client).  
- **ExternalAccessToken** (portails).  
- **CsvImport** : optionnel (PRD mentionne export CSV, pas import).  
- **Event** : optionnel (métriques dashboard simples sans table Event dédiée).

---

## 3. Fonctionnalités à retirer (hors périmètre v2.0)

- **Stripe / Billing** : pages checkout, billing, abonnements.  
- **Multi-utilisateurs** : rôles, assignation missions à un recruiter, gestion équipe.  
- **Chrome Extension** : dossier `chrome-extension/`, routes API extension, pages marketing extension.  
- **LinkedIn** : OAuth, champs User (linkedin*), enrichment, cache, scoring.  
- **Portails** : candidat et client (routes, tokens, shortlists, feedback client).  
- **Calendly** : champs Mission, webhooks.  
- **Transcription / réunions** : champs Interview, intégrations Meet/Zoom.  
- **Analytics avancés** : Event, rapports complexes ; garder uniquement agrégats dashboard.  
- **API publique / webhooks** (hors auth callback) : désactiver ou supprimer.

Fichiers / zones à adapter ou supprimer (liste non exhaustive) :

- `src/app/(dashboard)/checkout/`, `settings/billing/`  
- `src/app/(dashboard)/settings/extension/`, `(marketing)/extension/`  
- `src/app/(dashboard)/pools/`, `tasks/`, `import/` (si exclus).  
- `src/app/(portals)/`, `(auth)/portal/`, `api/webhooks/` (stripe, calendly, meet, zoom).  
- `src/lib/actions/billing.ts`, `analytics.ts`, `portal.ts`, `shortlist.ts`, `tasks.ts`, `interviews.ts` (ou les simplifier fortement).  
- Composants portails, pipeline avec score/portal.

---

## 4. Fonctionnalités à adapter (alignement PRD)

- **Auth** : un seul “user” par organisation (l’utilisateur principal) ; pas de gestion d’équipe.  
- **Dashboard** : métriques simples (missions actives, total candidats, clients actifs, entretiens en cours) + missions récentes + actions rapides.  
- **Clients** : liste + détail ; formulaire avec `companyName` (MAJ), `category` (liste Settings), website, notes ; pas de `sector` libre.  
- **Contacts** : firstName, lastName, email obligatoire, title, phone, isPrimary ; lien Mission.mainContactId.  
- **Missions** : formulaire simplifié (sans visibilité, Calendly, scoring) ; champs PRD (jobTitle, client, mainContact, localisation, seniority, domain, sector, rémunération, contrat, descriptif, processus, status, priority, dates).  
- **Pipeline** : Kanban 6 colonnes (SOURCED → CONTACTED → INTERVIEW → SENT → HIRED | REJECTED) ; drag & drop = mise à jour status + dates optionnelles ; modal détail candidature (notes, feedback client, documents, timeline).  
- **Candidats** : liste avec filtres (domaine, secteur, séniorité, recruitable) ; détail ; export CSV (colonnes PRD).  
- **Settings** : onglet “Listes normalisées” avec clientCategories, domains, sectors, jobFamilies, contractTypes, seniorities ; pas de suppression d’une valeur utilisée.

---

## 5. Fonctionnalités à ajouter (manquantes ou partielles)

- **Organization.slug** (pour URLs type `/paul-recrutement`).  
- **OrganizationSettings** : clientCategories, contractTypes, seniorities + valeurs par défaut PRD.  
- **Client** : companyName (MAJ), category ; validation URL website.  
- **Contact** : firstName, lastName, isPrimary, email obligatoire ; relation mainContact sur Mission.  
- **Mission** : mainContactId, jobFamily, city, country, isRemote, languages (Json), domain, sector, salaryNotes, priority, startDate, deadline ; status/contractType/seniority en string depuis Settings.  
- **CandidateMission** (ou MissionCandidate renommé) : status à 6 valeurs ; internalNotes, clientFeedback ; contactedAt, interviewDate, sentToClientAt, hiredAt, rejectedAt, rejectionReason ; relation documents.  
- **Documents** : 4 modèles + upload Supabase (taille max 10 MB, types PDF, DOCX, XLSX, JPG, PNG).  
- **Auto-format** : companyName MAJ, lastName MAJ, firstName Capitalized, jobTitle Capitalized (côté serveur).  
- **Autocomplete** : currentCompany, currentPosition (suggestions depuis candidats existants).  
- **Export CSV candidats** : colonnes PRD, filtres appliqués.

---

## 6. Stratégie de migration recommandée

### Option A – Migration incrémentale (recommandée)

1. **Phase 1 – Schéma et données**  
   - Ajouter champs PRD (slug, clientCategories, contractTypes, seniorities, mainContactId, etc.).  
   - Créer ClientDocument, MissionDocument, CandidateDocument, CandidateMissionDocument.  
   - Renommer / migrer champs (name → companyName, title → jobTitle, etc.) avec migrations + scripts de données.  
   - Réduire pipeline à 6 statuts (migration enum ou string + mapping des anciennes valeurs).

2. **Phase 2 – Désactivation des features exclues**  
   - Masquer ou supprimer routes/pages : billing, extension, portails, pools, tasks, import (si exclus).  
   - Désactiver webhooks Stripe/Calendly/Meet/Zoom.  
   - Retirer champs UI (score, portal, Calendly, assignation recruiter).  
   - Garder en DB pour l’instant : Subscription, User, Event (pour rollback ou usage futur).

3. **Phase 3 – Alignement UI et actions**  
   - Clients : formulaire companyName + category.  
   - Contacts : firstName, lastName, isPrimary, email obligatoire.  
   - Missions : formulaire complet PRD, mainContact.  
   - Pipeline : Kanban 6 colonnes, modal détail, notes/feedback/dates.  
   - Candidats : filtres, export CSV.  
   - Settings : toutes les listes configurables.

4. **Phase 4 – Nettoyage**  
   - Supprimer modèles et code mort (LinkedIn, portails, questionnaires, etc.) une fois stabilité validée.

### Option B – Nouveau schéma v2 (branch dédiée)

- Créer un schéma Prisma v2 minimal (Organization, OrganizationSettings, Client, Contact, Mission, Candidate, CandidateMission + 4 modèles Document).  
- Migrations de données depuis l’ancien schéma (scripts ciblés).  
- Repartir des pages/actions sur cette base.

---

## 7. Prochaines étapes suggérées

1. **Valider** ce document (écarts et stratégie) avec l’équipe.  
2. **Choisir** Option A (incrémentale) ou B (schéma v2 séparé).  
3. **Démarrer Phase 1** :  
   - Modifier `prisma/schema.prisma` (ajouts + renommages + nouveaux modèles Document + pipeline 6 statuts).  
   - Générer migration(s) et script de migration des données (stages, mainContact, etc.).  
4. **Ensuite** : Phase 2 (désactivation features) puis Phase 3 (UI et Server Actions).

---

*Document généré pour alignement ORCHESTR sur le PRD v2.0 – à jour avec l’état du code au moment de la rédaction.*
