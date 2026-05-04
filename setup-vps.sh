#!/bin/bash
set -e
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

DOMAIN="impala-agence.com"
APP_DIR="/opt/impala-agence"

echo "=== [1/5] Installation Docker ==="
apt-get update -qq
apt-get install -y curl git ca-certificates gnupg

# Docker officiel
if ! command -v docker &>/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
  echo "Docker installé ✓"
else
  echo "Docker déjà installé ✓"
fi

echo "=== [2/5] Clone du repo ==="
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR" && git pull
else
  git clone https://github.com/louis-Q14/IMPALA-AGENCE.git "$APP_DIR"
fi
cd "$APP_DIR"

echo "=== [3/5] Configuration .env ==="
if [ ! -f .env ]; then
  cp .env.example .env
  # Générer un JWT secret aléatoire
  JWT=$(openssl rand -base64 48 | tr -d '\n')
  sed -i "s|CHANGE_MOI_SECRET_JWT_ALEATOIRE|$JWT|g" .env
  sed -i "s|CHANGE_MOI_MOT_DE_PASSE_DB|Impala2026DB!|g" .env
  sed -i "s|SEED_ADMIN_PASSWORD=CHANGE_MOI_MOT_DE_PASSE_ADMIN|SEED_ADMIN_PASSWORD=Impala@2026!|g" .env
  sed -i "s|STRIPE_SECRET_KEY=sk_live_VOTRE_CLE_STRIPE|STRIPE_SECRET_KEY=sk_test_placeholder|g" .env
  echo ".env créé ✓"
else
  echo ".env existant conservé ✓"
fi

echo "=== [4/5] Firewall + Certificat SSL ==="
ufw allow 22/tcp  2>/dev/null || true
ufw allow 80/tcp  2>/dev/null || true
ufw allow 443/tcp 2>/dev/null || true

CERT="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
if [ ! -f "$CERT" ]; then
  # Arrêter tout ce qui utilise le port 80
  docker compose -f docker-compose.yml -f docker-compose.prod.yml down 2>/dev/null || true
  fuser -k 80/tcp 2>/dev/null || true

  docker run --rm -p 80:80 \
    -v /etc/letsencrypt:/etc/letsencrypt \
    -v /var/lib/letsencrypt:/var/lib/letsencrypt \
    certbot/certbot certonly \
    --standalone --non-interactive --agree-tos \
    --email admin@impala-agence.com \
    -d "$DOMAIN" -d "www.$DOMAIN"
  echo "Certificat SSL obtenu ✓"
else
  echo "Certificat SSL existant ✓"
fi

echo "=== [5/5] Démarrage de l'application ==="
docker compose -f docker-compose.yml -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

sleep 15
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

echo ""
echo "============================================"
echo "  IMPALA-AGENCE est en ligne !"
echo "  https://$DOMAIN"
echo "============================================"
