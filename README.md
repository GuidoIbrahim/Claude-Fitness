# Claude Fitness

App para registrar tu dieta día a día al estilo MacroFactor: sacás una foto del plato, la IA (Claude) estima los alimentos, porciones, calorías y macros, y vos corregís lo que haga falta antes de guardarlo. Después seguís tu progreso contra un objetivo calórico (déficit, mantenimiento o superávit) que podés cambiar cuando quieras.

## Funciones

- **Hoy**: anillo de calorías, barras de proteína / carbohidratos / grasas contra tu meta, lista de comidas con foto. Navegás a días anteriores.
- **Agregar**: foto desde la cámara o galería + aclaraciones opcionales → análisis con IA que desglosa cada alimento. Todos los valores son editables antes de guardar. También hay carga manual.
- **Historial**: promedio diario, días registrados, proyección de kg/semana según tu balance calórico, gráfico de calorías por día (7 / 30 / 90 días) y promedio de macros.
- **Peso**: pesajes diarios con línea de tendencia suavizada (media móvil exponencial) para no mirar el ruido diario.
- **Objetivo**: datos personales → metabolismo basal (Mifflin-St Jeor) y gasto diario (TDEE). Elegís déficit / mantener / superávit, el ritmo en kg por semana, la proteína por kg de peso y el % de grasas. O fijás las calorías a mano.

## Requisitos

- Node.js 20 o superior.
- Una clave de la API de Anthropic: https://console.anthropic.com/

## Cómo correrla

```bash
npm install
cp .env.example .env      # y pegá tu ANTHROPIC_API_KEY
npm run dev               # http://localhost:3000
```

Para producción:

```bash
npm run build
npm start
```

Los datos quedan en la carpeta `data/` (base SQLite `app.db` y las fotos en `data/uploads/`). Podés cambiarla con la variable `DATA_DIR`. Hacé backup de esa carpeta y tenés todo tu historial.

### Usarla desde el celular

La app está pensada para el teléfono. Corrés el servidor en tu PC o en un VPS y entrás desde el navegador del celular (en la misma red: `http://IP-de-tu-PC:3000`). Desde Safari o Chrome podés "Agregar a pantalla de inicio" y queda como una app. El botón **Cámara** abre la cámara trasera directamente.

### Docker

```bash
docker build -t claude-fitness .
docker run -p 3000:3000 -e ANTHROPIC_API_KEY=sk-ant-... -v $(pwd)/data:/app/data claude-fitness
```

## Cómo funciona el análisis

`lib/analyze.ts` manda la foto (reducida a 1280 px) a Claude con un prompt de nutricionista y pide una respuesta estructurada (JSON validado con Zod): lista de alimentos con porción estimada en gramos y macros, totales, nivel de confianza y notas con los supuestos (por ejemplo, cuánto aceite se asumió). Los totales se recalculan sumando los items para que siempre cierren. El modelo se elige con `ANTHROPIC_MODEL` (por defecto `claude-opus-5-5`).

Tené en cuenta que una estimación por foto tiene un margen de error real (sobre todo en porciones y aceites). Si pesás algo, escribilo en "Aclaraciones" y el modelo lo va a priorizar.

## Estructura

```
app/                 páginas (Next.js App Router) y rutas de API
  api/analyze        foto → Claude → macros
  api/meals          CRUD de comidas
  api/days           resumen por día
  api/weights        pesajes + tendencia
  api/profile        perfil y metas calculadas
components/          UI compartida (anillo, barras, gráficos, editor de macros)
lib/
  analyze.ts         llamada a Claude con salida estructurada
  nutrition.ts       BMR / TDEE / metas de macros / tendencia de peso
  db.ts              SQLite (better-sqlite3)
```
