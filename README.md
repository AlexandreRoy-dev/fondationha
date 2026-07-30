# Fondation Honorer Aimer

Site web statique de la [Fondation Honorer Aimer](https://fondationha.com) - *Ensemble, vivons le deuil autrement*.

## Stack

- HTML sémantique, CSS (design tokens), JavaScript ESM
- Hébergement prévu : GitHub Pages
- Dons : Stripe Payment Link (pas de clé API côté client)

## Structure

```
├── index.html
├── mission.html
├── approche.html
├── a-propos.html
├── conseil.html
├── dons.html
├── 404.html
├── sitemap.xml
├── robots.txt
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

## Stripe - formulaire de don

Le site propose des montants suggérés (25 / 50 / 100 / 250 $ ou montant libre), puis ouvre **un seul Payment Link** Stripe (CAD, montant libre). Le donateur confirme le montant sur la page Stripe.

URL live dans [`js/modules/config.js`](js/modules/config.js) (`STRIPE_PAYMENT_LINK`).

Après paiement, Stripe redirige vers `dons.html?don=merci`.

Aucune clé secrète n’est dans le site; seulement l’URL publique `donate.stripe.com/...`.

## Déploiement GitHub Pages

1. Pousser la branche `main`
2. Settings → Pages → Source : Deploy from branch `main` / root (ou `/docs` selon la config existante)
3. Domaine personnalisé : `fondationha.com` (fichier `CNAME` si utilisé)
4. Vérifier HTTPS

## Photos du conseil d’administration

Les cartes du CA utilisent pour l’instant des monogrammes. Pour ajouter les photos :

1. Déposer les fichiers dans `assets/images/board/` (ex. `dominique-st-jean.jpg`)
2. Remplacer le `<div class="board-card__avatar">` par un `<img>` dans `conseil.html`

## Contact

`bonjour@fondationha.com`
