#!/usr/bin/env bash
# Alternative a seed-categories.sql : insere les categories manquantes en passant
# par l'API du backend (donc via les memes validations que l'admin), plutot que
# directement en base. Utile si vous n'avez pas d'acces direct a Postgres.
#
# Usage :
#   chmod +x seed-categories.sh
#   ADMIN_USERNAME=admin ADMIN_PASSWORD='votre_mot_de_passe' ./seed-categories.sh
#
# Le backend doit tourner sur le port 8081 (BASE_URL ci-dessous).

set -euo pipefail

BASE_URL="http://localhost:8081"
ADMIN_USERNAME="${ADMIN_USERNAME:-admin}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:?Definissez ADMIN_PASSWORD avec le mot de passe admin actuel}"

echo "Connexion a l'espace admin..."
TOKEN=$(curl -sS -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$ADMIN_USERNAME\",\"password\":\"$ADMIN_PASSWORD\"}" \
    | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")

if [ -z "$TOKEN" ]; then
    echo "Echec de connexion : verifiez ADMIN_USERNAME / ADMIN_PASSWORD." >&2
    exit 1
fi
echo "Connecte."

# nom;slug — la categorie "Outillage electroportatif" existe deja et sera
# simplement refusee par l'API (message "existe deja"), sans casser le script.
CATEGORIES=(
    "Outillage électroportatif;outillage-electroportatif"
    "Accessoires;accessoires"
    "Outils à main;outils-a-main"
    "Outils de jardin;outils-de-jardin"
    "Outils de mesure;outils-de-mesure"
    "Outils de sécurité;outils-de-securite"
    "Poste à souder;poste-a-souder"
    "Outillages pneumatiques;outillages-pneumatiques"
    "Outils Sans Fil;outils-sans-fil"
    "Packs;packs"
    "Flash Promos;flash-promos"
    "Pompes à eau;pompes-a-eau"
)

for entry in "${CATEGORIES[@]}"; do
    nom="${entry%%;*}"
    slug="${entry##*;}"
    reponse=$(curl -sS -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/categories" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "{\"nom\":\"$nom\",\"slug\":\"$slug\",\"imageUrl\":null}")
    if [ "$reponse" = "200" ] || [ "$reponse" = "201" ]; then
        echo "OK   - $nom"
    else
        echo "SKIP - $nom (HTTP $reponse, probablement deja existante)"
    fi
done

echo "Termine."
