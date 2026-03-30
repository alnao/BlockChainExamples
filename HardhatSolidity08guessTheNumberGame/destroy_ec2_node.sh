#!/bin/bash

REGION="eu-central-1"
export AWS_PAGER=""

echo "🔥 Inizio procedura di distruzione nodo Blockchain su AWS ($REGION)..."

# 1. Trova le istanze con tag Name=BlockchainNode
echo "🔍 Ricerca istanze con tag Name=BlockchainNode..."
INSTANCE_IDS=$(aws ec2 describe-instances \
    --region $REGION \
    --filters "Name=tag:Name,Values=BlockchainNode" "Name=instance-state-name,Values=running,stopped,pending" \
    --query "Reservations[].Instances[].InstanceId" \
    --output text)

if [ -z "$INSTANCE_IDS" ]; then
    echo "⚠️ Nessuna istanza trovata."
else
    # Sostituisci tab con spazi per visualizzazione
    echo "✅ Istanze trovate: ${INSTANCE_IDS//$'\t'/ }"
    
    # 2. Termina le istanze
    echo "🛑 Terminazione istanze in corso..."
    aws ec2 terminate-instances --instance-ids $INSTANCE_IDS --region $REGION
    
    echo "⏳ Attesa terminazione istanze..."
    aws ec2 wait instance-terminated --instance-ids $INSTANCE_IDS --region $REGION
    echo "✅ Istanze terminate."
fi

# 3. Trova e cancella i Security Groups creati dallo script (blockchain-node-sg-*)
echo "🔍 Ricerca Security Groups 'blockchain-node-sg-*'..."
SG_IDS=$(aws ec2 describe-security-groups \
    --region $REGION \
    --filters "Name=group-name,Values=blockchain-node-sg-*" \
    --query "SecurityGroups[].GroupId" \
    --output text)

if [ -z "$SG_IDS" ]; then
    echo "⚠️ Nessun Security Group trovato."
else
    echo "✅ Security Groups trovati: ${SG_IDS//$'\t'/ }"
    
    # Itera su ogni ID perché delete-security-group accetta un ID alla volta o bisogna gestire errori se uno è in uso
    for SG_ID in $SG_IDS; do
        echo "🗑️ Cancellazione Security Group $SG_ID..."
        # Tentativo di cancellazione (potrebbe fallire se ancora associato a qualcosa che sta morendo)
        # Aggiungiamo un piccolo loop di retry o sleep se necessario, ma di solito dopo instance-terminated è ok.
        aws ec2 delete-security-group --group-id $SG_ID --region $REGION
    done
    echo "✅ Pulizia Security Groups completata."
fi

# 4. Pulisci .env
if [ -f .env ]; then
    echo "🧹 Pulizia file .env..."
    # Rimuove le righe EC2_IP e EC2_URL
    sed -i '/^EC2_IP=/d' .env
    sed -i '/^EC2_URL=/d' .env
    echo "✅ File .env aggiornato."
fi

echo "---------------------------------------------------"
echo "💀 Distruzione completata. Risorse rimosse."
echo "---------------------------------------------------"
