# Fondation Honorer Aimer

Site web statique de la [Fondation Honorer Aimer](https://fondationha.com) — *Ensemble, vivons le deuil autrement*.

## Stack

- HTML sémantique, CSS (design tokens), JavaScript ESM
- Hébergement prévu : GitHub Pages
- Dons : Stripe Payment Link (pas de clé API côté client)

## Structure

```
├── index.html
├── css/
│   ├── tokens.css
│   └── styles.css
├── js/
│   ├── main.js
│   └── modules/
│       ├── config.js    ← URL Stripe ici
│       ├── nav.js
│       └── reveal.js
├── assets/images/
└── README.md
```

## Développement local

Ouvrir `index.html` via un serveur local (les modules ES nécessitent HTTP, pas `file://`) :

```bash
# Python
python -m http.server 8080

# ou Node
npx serve .
```

Puis ouvrir `http://localhost:8080`.

## Stripe — bouton « Faire un don »

Le site utilise un **Payment Link** Stripe (page de paiement hébergée). Aucune clé secrète n’est exposée dans le navigateur.

### Créer le lien (compte Stripe de la fondation)

1. Se connecter au [Stripe Dashboard](https://dashboard.stripe.com/)
2. **Payment Links** → **New**
3. Produit : `Don — Fondation Honorer Aimer`
4. Prix : **Customer chooses what to pay** (montant libre)
5. Devise : **CAD**
6. (Optionnel) After payment → redirect vers `https://fondationha.com/?don=merci` pour afficher le bandeau de remerciement
7. Copier l’URL (`https://buy.stripe.com/...`)

### Brancher le lien dans le site

Ouvrir [`js/modules/config.js`](js/modules/config.js) et coller l’URL :

```js
export const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/VOTRE_LIEN";
```

Tant que la constante est vide, les boutons « Faire un don » ouvrent un courriel vers `bonjour@fondationha.com`.

## Déploiement GitHub Pages

1. Pousser la branche `main`
2. Settings → Pages → Source : Deploy from branch `main` / root (ou `/docs` selon la config existante)
3. Domaine personnalisé : `fondationha.com` (fichier `CNAME` si utilisé)
4. Vérifier HTTPS

## Photos du conseil d’administration

Les cartes du CA utilisent pour l’instant des monogrammes. Pour ajouter les photos :

1. Déposer les fichiers dans `assets/images/board/` (ex. `dominique-st-jean.jpg`)
2. Remplacer le `<div class="board-card__avatar">` par un `<img>` dans `index.html`

## Contact

`bonjour@fondationha.com`
