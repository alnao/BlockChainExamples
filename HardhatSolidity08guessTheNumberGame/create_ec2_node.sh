#!/bin/bash

# Configurazione
KEY_NAME=${1:-"alberto-nao-francoforte"}
REGION="eu-central-1" # Francoforte
SG_NAME="blockchain-node-sg-$(date +%s)" # Nome univoco per evitare conflitti
INSTANCE_TYPE="t2.medium"
export AWS_PAGER=""

echo "🚀 Inizio procedura di creazione nodo Blockchain su AWS ($REGION)..."

# 1. Rileva IP Pubblico
echo "🔍 Rilevamento IP pubblico..."
MY_IP=$(curl -s https://checkip.amazonaws.com)
if [ -z "$MY_IP" ]; then
    echo "❌ Impossibile rilevare l'IP pubblico."
    exit 1
fi
echo "✅ IP rilevato: $MY_IP"

# 2. Trova l'AMI Ubuntu 22.04 LTS più recente
echo "🔍 Ricerca AMI Ubuntu 22.04 LTS..."
AMI_ID=$(aws ec2 describe-images \
    --region $REGION \
    --owners 099720109477 \
    --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" "Name=state,Values=available" \
    --query "sort_by(Images, &CreationDate)[-1].ImageId" \
    --output text)

if [ -z "$AMI_ID" ] || [ "$AMI_ID" == "None" ]; then
    echo "❌ Impossibile trovare un'AMI valida."
    exit 1
fi
echo "✅ AMI trovata: $AMI_ID"

# 3. Crea Security Group
echo "🛡️ Creazione Security Group: $SG_NAME..."
SG_ID=$(aws ec2 create-security-group \
    --group-name $SG_NAME \
    --description "Security group for Blockchain node (SSH, Geth, RPC)" \
    --region $REGION \
    --output text \
    --query 'GroupId')

echo "✅ Security Group creato: $SG_ID"

# 4. Aggiungi regole Inbound (Solo dal tuo IP)
echo "🛡️ Configurazione regole firewall..."
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 22 --cidr ${MY_IP}/32 --region $REGION
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 30303 --cidr ${MY_IP}/32 --region $REGION
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 8545 --cidr ${MY_IP}/32 --region $REGION
echo "✅ Regole applicate per IP $MY_IP"

# 5. Lancia l'istanza
echo "🚀 Avvio istanza $INSTANCE_TYPE con chiave $KEY_NAME..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --count 1 \
    --instance-type $INSTANCE_TYPE \
    --key-name $KEY_NAME \
    --security-group-ids $SG_ID \
    --region $REGION \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=BlockchainNode}]" \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "✅ Istanza avviata: $INSTANCE_ID"
echo "⏳ Attesa che l'istanza sia in stato 'running'..."
aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region $REGION

# 6. Recupera IP Pubblico
EC2_IP=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --region $REGION \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo "---------------------------------------------------"
echo "🎉 Istanza pronta!"
echo "ID: $INSTANCE_ID"
echo "IP Pubblico: $EC2_IP"
echo "Comando SSH: ssh -i ${KEY_NAME}.pem ubuntu@$EC2_IP"
echo "---------------------------------------------------"

# 7. Esporta variabile e aggiorna .env (opzionale)
export EC2_IP=$EC2_IP

# Aggiorna il file .env se esiste
if [ -f .env ]; then
    # Se EC2_IP esiste già, lo sostituisce, altrimenti lo aggiunge
    if grep -q "EC2_IP=" .env; then
        sed -i "s/^EC2_IP=.*/EC2_IP=$EC2_IP/" .env
    else
        echo "EC2_IP=$EC2_IP" >> .env
    fi
    
    # Aggiorna anche EC2_URL per comodità
    NEW_URL="http://$EC2_IP:8545"
    if grep -q "EC2_URL=" .env; then
        # Usa un delimitatore diverso per sed (es. |) perché l'URL contiene /
        sed -i "s|^EC2_URL=.*|EC2_URL=$NEW_URL|" .env
    else
        echo "EC2_URL=$NEW_URL" >> .env
    fi
    echo "✅ File .env aggiornato con il nuovo IP."
fi
