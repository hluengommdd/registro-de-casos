#!/bin/bash

# Script para generar backup de schema únicamente (sin datos)
# Requiere: Supabase CLI instalada
# NO EJECUTAR si no tienes IPv4

echo "⚠️  ADVERTENCIA: Este script requiere Supabase CLI y acceso IPv4"
echo "Si no tienes acceso, usa el archivo schema.sql directamente"
echo ""
read -p "¿Continuar? (s/n): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    exit 1
fi

# Solicitar datos del proyecto
read -p "Project ID de Supabase: " PROJECT_ID
read -sp "Database Password: " DB_PASSWORD
echo ""

# Generar backup de schema
echo "🔄 Generando backup de schema..."

supabase db dump \
    --project-id "$PROJECT_ID" \
    --password "$DB_PASSWORD" \
    --schema public \
    --data-only=false \
    > schema_backup_$(date +%Y%m%d_%H%M%S).sql

echo "✅ Backup generado exitosamente"
