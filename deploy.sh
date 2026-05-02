#!/bin/bash
# ============================================================
# deploy.sh — Script de déploiement production IMPALA-AGENCE
# Serveur : Ubuntu 22.04, Docker + Docker Compose installés
# Usage   : sudo bash deploy.sh
# ============================================================

set -e

DOMAIN="impala-agence.com"
EMAIL="admin@impala-agence.com"   # email Let's Encrypt
APP_DIR="/opt/impala-agence"
REPO_URL="https://github.com/VOTRE_USER/VOTRE_REPO.git"   # ← à modifier

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()    { echo -e "${GREEN}[INFO]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ────────────────────────────────────────────────────────────
# 1. Cloner ou mettre à jour le dépôt
# ────────────────────────────────────────────────────────────
info "=== Étape 1 : Code source ==="

if [ -d "$APP_DIR/.git" ]; then
    info "Mise à jour du dépôt..."
    cd "$APP_DIR"
    git pull
else
    info "Clonage du dépôt dans $APP_DIR..."
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# ────────────────────────────────────────────────────────────
# 2. Créer le fichier .env s'il n'existe pas
# ────────────────────────────────────────────────────────────
info "=== Étape 2 : Configuration .env ==="

if [ ! -f "$APP_DIR/.env" ]; then
    warning "Fichier .env manquant — création depuis le modèle..."
    cp "$APP_DIR/.env.example" "$APP_DIR/.env" 2>/dev/null || cat > "$APP_DIR/.env" << 'EOF'
# ── Base de données ──────────────────────────────────────
DB_PASSWORD=CHANGE_MOI_MOT_DE_PASSE_DB

# ── JWT ──────────────────────────────────────────────────
JWT_SECRET=CHANGE_MOI_SECRET_JWT_ALEATOIRE

# ── Stripe ───────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_live_VOTRE_CLE_STRIPE

# ── Super Admin initial ──────────────────────────────────
SEED_ADMIN_EMAIL=louis.quatorze@impala-agence.com
SEED_ADMIN_PASSWORD=CHANGE_MOI_MOT_DE_PASSE_ADMIN
SEED_ADMIN_NAME=Louis-Quatorze

# ── Twilio SMS ───────────────────────────────────────────
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
EOF
    error "Remplissez les valeurs dans $APP_DIR/.env puis relancez ce script."
fi

info ".env trouvé ✓"

# ────────────────────────────────────────────────────────────
# 3. DNS check
# ────────────────────────────────────────────────────────────
info "=== Étape 3 : Vérification DNS ==="

SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip)
DOMAIN_IP=$(getent hosts "$DOMAIN" 2>/dev/null | awk '{print $1}' | head -1)

if [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
    warning "DNS pas encore propagé : $DOMAIN → $DOMAIN_IP (serveur : $SERVER_IP)"
    warning "Assurez-vous que les enregistrements DNS A pointent vers $SERVER_IP"
    read -p "Continuer quand même ? (y/N) " -n 1 -r; echo
    [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1
else
    info "DNS OK : $DOMAIN → $SERVER_IP ✓"
fi

# ────────────────────────────────────────────────────────────
# 4. Obtenir le certificat SSL (si pas encore fait)
# ────────────────────────────────────────────────────────────
info "=== Étape 4 : Certificat SSL ==="

CERT_PATH="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"

if [ -f "$CERT_PATH" ]; then
    info "Certificat SSL existant trouvé ✓"
else
    info "Obtention du certificat via Let's Encrypt (certbot standalone)..."

    # Libérer le port 80 si Nginx tourne
    docker compose -f docker-compose.yml -f docker-compose.prod.yml stop nginx 2>/dev/null || true

    docker run --rm \
        -p 80:80 \
        -v "/etc/letsencrypt:/etc/letsencrypt" \
        -v "/var/lib/letsencrypt:/var/lib/letsencrypt" \
        certbot/certbot certonly \
        --standalone \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL" \
        -d "$DOMAIN" \
        -d "www.$DOMAIN" || error "Échec obtention certificat SSL"

    info "Certificat SSL obtenu ✓"

    # Créer un lien symbolique dans le répertoire certbot Docker
    # (les volumes certbot pointent vers /etc/letsencrypt du container)
fi

# ────────────────────────────────────────────────────────────
# 5. Construire et démarrer tous les services
# ────────────────────────────────────────────────────────────
info "=== Étape 5 : Build et démarrage ==="

# Arrêter l'ancienne stack si elle tourne
docker compose -f docker-compose.yml -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true

# Construire et démarrer
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

info "Services démarrés ✓"

# ────────────────────────────────────────────────────────────
# 6. Vérification
# ────────────────────────────────────────────────────────────
info "=== Étape 6 : Vérification ==="

sleep 10
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

echo ""
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}  IMPALA-AGENCE est en ligne !${NC}"
echo -e "${GREEN}  https://$DOMAIN${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo ""
echo "  Logs backend  : docker compose -f docker-compose.yml -f docker-compose.prod.yml logs backend -f"
echo "  Logs frontend : docker compose -f docker-compose.yml -f docker-compose.prod.yml logs frontend -f"
echo "  Logs nginx    : docker compose -f docker-compose.yml -f docker-compose.prod.yml logs nginx -f"
echo ""
