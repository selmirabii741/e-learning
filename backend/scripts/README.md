# Scripts Backend — EduAI

Ces scripts sont des utilitaires de gestion de la base de données.
Ils ne font **pas** partie du code applicatif (server.js).

## Scripts disponibles

| Script | Description |
|---|---|
| `seed.js` | Peuple la base de données avec des données de test |
| `create-benali.js` | Crée un utilisateur spécifique pour les tests |
| `publish-all.js` | Publie tous les cours en brouillon |

## Utilisation
```bash
# Depuis le dossier backend/
node scripts/seed.js
node scripts/create-benali.js
node scripts/publish-all.js
```

> ⚠️ Assurez-vous que les variables d'environnement `.env` sont configurées et que MongoDB est accessible avant d'exécuter ces scripts.
