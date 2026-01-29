#!/bin/bash

# Script para verificar que el frontend tiene todos los cambios necesarios

echo "🔍 Verificando cambios en frontend..."
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

checks_passed=0
checks_failed=0

# CHECK 1: db.js tiene process_stage con default
echo "CHECK 1: db.js - process_stage con default..."
if grep -q "Etapa_Debido_Proceso || 'Seguimiento'" /workspaces/convivencia-escolar/src/api/db.js; then
  echo -e "${GREEN}✅ PASS${NC}: process_stage tiene default value"
  ((checks_passed++))
else
  echo -e "${RED}❌ FAIL${NC}: process_stage podría no tener default"
  ((checks_failed++))
fi
echo ""

# CHECK 2: CaseDetailPanel importa getCase
echo "CHECK 2: CaseDetailPanel - importa getCase..."
if grep -q "import.*getCase.*from.*api/db" /workspaces/convivencia-escolar/src/components/CaseDetailPanel.jsx; then
  echo -e "${GREEN}✅ PASS${NC}: getCase importado correctamente"
  ((checks_passed++))
else
  echo -e "${RED}❌ FAIL${NC}: getCase no está importado"
  ((checks_failed++))
fi
echo ""

# CHECK 3: CaseDetailPanel emite DataUpdated
echo "CHECK 3: CaseDetailPanel - emitDataUpdated..."
if grep -q "emitDataUpdated()" /workspaces/convivencia-escolar/src/components/CaseDetailPanel.jsx; then
  echo -e "${GREEN}✅ PASS${NC}: emitDataUpdated() presente"
  ((checks_passed++))
else
  echo -e "${RED}❌ FAIL${NC}: emitDataUpdated() no encontrado"
  ((checks_failed++))
fi
echo ""

# CHECK 4: CaseDetailPanel tiene delay de 1000ms
echo "CHECK 4: CaseDetailPanel - delay de 1000ms..."
if grep -q "1000" /workspaces/convivencia-escolar/src/components/CaseDetailPanel.jsx; then
  echo -e "${GREEN}✅ PASS${NC}: Delay encontrado"
  ((checks_passed++))
else
  echo -e "${YELLOW}⚠️  WARNING${NC}: No se encontró delay explícito"
  ((checks_failed++))
fi
echo ""

# CHECK 5: Seguimientos tiene el estado check correcto
echo "CHECK 5: Seguimientos - estado check para botón..."
if grep -q "estado.*toLowerCase.*en seguimiento" /workspaces/convivencia-escolar/src/pages/Seguimientos.jsx; then
  echo -e "${GREEN}✅ PASS${NC}: Lógica de estado correcta"
  ((checks_passed++))
else
  echo -e "${RED}❌ FAIL${NC}: Lógica de estado podría estar mal"
  ((checks_failed++))
fi
echo ""

# CHECK 6: Sidebar importa onDataUpdated
echo "CHECK 6: Sidebar - importa onDataUpdated..."
if grep -q "import.*onDataUpdated" /workspaces/convivencia-escolar/src/components/Sidebar.jsx; then
  echo -e "${GREEN}✅ PASS${NC}: onDataUpdated importado"
  ((checks_passed++))
else
  echo -e "${RED}❌ FAIL${NC}: onDataUpdated no está importado"
  ((checks_failed++))
fi
echo ""

# CHECK 7: refreshBus existe
echo "CHECK 7: refreshBus - archivo existe..."
if [ -f /workspaces/convivencia-escolar/src/utils/refreshBus.js ]; then
  echo -e "${GREEN}✅ PASS${NC}: refreshBus.js existe"
  ((checks_passed++))
else
  echo -e "${RED}❌ FAIL${NC}: refreshBus.js no existe"
  ((checks_failed++))
fi
echo ""

# CHECK 8: app.jsx runing (dev server)
echo "CHECK 8: Dev server status..."
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
  echo -e "${GREEN}✅ PASS${NC}: Dev server running en puerto 5173"
  ((checks_passed++))
else
  echo -e "${YELLOW}⚠️  INFO${NC}: Dev server no está corriendo en 5173"
  ((checks_failed++))
fi
echo ""

# SUMMARY
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "RESUMEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Pasados: $checks_passed${NC}"
echo -e "${RED}❌ Fallidos: $checks_failed${NC}"
echo ""

if [ $checks_failed -eq 0 ]; then
  echo -e "${GREEN}✅ FRONTEND LISTO${NC}"
  exit 0
else
  echo -e "${RED}❌ HAY PROBLEMAS${NC} - Revisar arriba"
  exit 1
fi
