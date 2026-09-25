# EcoleCRM — PWA/SAAS de gestion scolaire (Zone UEMOA)

Application web progressive (PWA) complète pour la gestion d'établissements **Primaire, Secondaire et Universitaire**.
Conçue pour l'Afrique de l'Ouest (zone UEMOA) : **FCFA (XOF)**, **Orange Money, Wave, MTN MoMo, Moov Money**, mode **hors ligne** avec synchronisation automatique, interface **multilingue Français / Anglais**.

> Design inspiré de [AdminCN (shadcn admin)](https://themewagon.github.io/admincn/dashboard/orders/) pour l'application
> et de [Material Tailwind App Presentation](https://themewagon.github.io/NextJS-Tailwind-App-Presentation-Page/) pour la landing page.

## 🚀 Démarrage

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build de production (dist/)
```

## 🔐 Comptes de démonstration

| Portail | E-mail | Mot de passe |
|---|---|---|
| Administrateur | admin@ecole.cm | admin123 |
| Enseignant | prof@ecole.cm | prof123 |
| Parent | parent@ecole.cm | parent123 |
| Comptabilité | compta@ecole.cm | compta123 |
| Secrétariat | secretariat@ecole.cm | secretaire123 |
| Chef Discipline | discipline@ecole.cm | discipline123 |
| Censorat | censeur@ecole.cm | censeur123 |

## ✨ Fonctionnalités

- **3 modules** : Primaire (notes /10), Secondaire (/20, conseils de classe), Universitaire (crédits, semestres)
- **8 portails** dédiés par rôle (parent, enseignant, personnel, discipline, secrétariat, comptabilité, censorat, admin)
- **Gestion du personnel** : CRUD, rôles & permissions (matrice), présences, performances
- **Scolarité** : inscriptions, classes, matières & coefficients, saisie des notes, **bulletins PDF**, relevés, appel (présences)
- **Finances** : paiements (Mobile Money simulé : OM/Wave/MTN/Moov, espèces, virement, chèque), dépenses, **reçus PDF**, frais par classe, rapports
- **Discipline** : incidents, gravité, sanctions, suivi de conduite, notification auto des parents
- **Communication** : notifications push (Web Notifications), messages ciblés, modèles
- **Rapports analytiques** : performance scolaire, finances, discipline — export **PDF / Excel**
- **Hors ligne** : IndexedDB (Dexie), Service Worker, file de synchronisation avec flush auto au retour du réseau
- **Sécurité** : authentification JWT simulée (payload signé), sessions persistantes, sauvegarde/restauration JSON

## 🛠 Stack

React 18 · TypeScript · Vite · Tailwind CSS (thème shadcn) · Dexie (IndexedDB) · Recharts · lucide-react · xlsx

## 📁 Structure

```
src/
├── components/     # AppShell (sidebar/topbar), UI kit (shadcn-style)
├── db/             # Schéma Dexie, données de démo (UEMOA), requêtes d'analyse
├── i18n/           # FR/EN (~450 clés)
├── pages/          # Landing, Login, Dashboard, Students, Academic, Finance,
│                   # Staff, Discipline, Messages, Reports, Settings,
│                   # Teaching (enseignant), Family (parent), Tasks (personnel)
├── state/          # Auth (JWT), thème, toasts, sync/offline
└── utils/          # Format FCFA/dates, export Excel, impression PDF
public/             # manifest.webmanifest, sw.js, icônes PWA
```
