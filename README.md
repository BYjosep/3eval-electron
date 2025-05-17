Perfecto, ahora te presento el **README completo y profesional** para la **parte de escritorio del proyecto**, basada en Electron:

---

# 🖥️ Evaluación Geolocalizada – Versión Escritorio (Electron)

Esta es la versión de escritorio del proyecto de evaluación basada en geolocalización, desarrollada con **Electron** y diseñada para ser utilizada por creadores o administradores de contenido. Permite crear, editar y gestionar listas de puntos con preguntas vinculadas a ubicaciones específicas.

---

## 🧩 Características principales

* 📍 Interfaz de mapa interactiva con Leaflet.js.

* 📝 Creación y edición de puntos geolocalizados:

    * Título
    * Pregunta
    * Entre 2 y 10 respuestas posibles (una marcada como correcta).

* 🗃️ Gestión de listas:

    * Crear, seleccionar y eliminar listas (archivos `.json`).
    * Almacenadas localmente en la carpeta `data/`.

* 💾 Guardado automático de puntos en formato JSON.

* 🧭 Visualización del mapa con diferentes capas: callejero, relieve y satélite.

* 🌗 Modo claro/oscuro integrado.

---

## 📁 Estructura del Proyecto

```bash
📁 3eval-electron/
├── data/                     # Contiene las listas creadas en formato .json
├── icon/                    # Iconos utilizados en los puntos
├── public/
│   ├── index.html           # Interfaz principal
│   └── Style.css            # Estilos de la interfaz
├── src/
│   ├── main/                # Lógica principal de Electron
│   │   └── main.js
│   ├── preload/             # Canal seguro entre Node y frontend
│   │   └── preload.js
│   ├── renderer/            # Lógica del mapa e interfaz
│   │   └── renderer.js
│   └── utils/
│       └── constants.js     # Constantes de rutas
├── package.json
└── pnpm-lock.yaml
```

---

## 🛠️ Instalación y ejecución

### 1. Clona el repositorio

```bash
git clone https://github.com/BYjosep/3eval-electron
cd 3eval-electron
```

### 2. Instala dependencias

```bash
pnpm install
```

> Se recomienda usar [PNPM](https://pnpm.io/) por su rapidez y compatibilidad con monorepos.

### 3. Ejecuta la aplicación

```bash
pnpm start
```

---

## ✍️ Uso de la aplicación

### 📂 Gestión de listas

* Puedes crear nuevas listas desde la barra lateral.
* Las listas se guardan como archivos `.json` en la carpeta `data/`.
* Al seleccionar una lista, se cargan los puntos en el mapa para editarlos o eliminarlos.

### ➕ Añadir puntos

1. Haz clic en el mapa para añadir un nuevo punto.
2. Completa:

    * Título del punto
    * Pregunta
    * Mínimo 2, máximo 10 respuestas
    * Marca la respuesta correcta
3. Guarda el punto.

### 🗑️ Borrar puntos

Haz clic derecho sobre un punto para eliminarlo.

---

## 🗺️ Capas de mapa

Puedes cambiar entre:

* 🧭 Callejero (OpenStreetMap)
* 🌍 Satélite (Esri)
* 🗺️ Relieve (OpenTopoMap)

---

## 🌙 Modo oscuro

Desde la interfaz puedes activar un **modo noche** para mejorar la visualización en ambientes con poca luz.

---

## 📦 Exportación de datos

* Cada lista creada se guarda automáticamente en `data/` como archivo `.json`.
* Estos archivos pueden ser usados directamente por la versión web del proyecto o compartidos.

---

## 📌 Formato de archivo `.json` generado

```json
[
  {
    "title": "Nombre del punto",
    "question": "¿Cuál es la capital de Francia?",
    "coords": [48.8566, 2.3522],
    "answers": [
      { "text": "Madrid", "correct": false },
      { "text": "París", "correct": true },
      { "text": "Berlín", "correct": false }
    ]
  }
]
```

---

## ⚠️ Recomendaciones

* No edites manualmente los archivos `.json` salvo que sepas lo que estás haciendo.
* Usa el editor visual del programa para mantener la integridad del formato.

---

## 🧪 Estado del proyecto

* ✅ Funcional para edición local de listas.
* ✅ Compatible con la versión web.
* ✅ Sincronizable con GitHub manualmente (repositorio de datos externo).
