# EnclosureAI 🚀

**The future of parametric enclosure design. Describe your device. Get your STL. Get printing.**

EnclosureAI converts natural language into production-ready 3D printable enclosures using Llama 3.3 and OpenSCAD.

---

## ✨ Features

- **Prompt-to-CAD**: Natural language interpretation of mechanical requirements.
- **Iterative Chain**: Design through conversation—stable versioning across prompts.
- **Interactive 3D Preview**: Full Three.js viewer with diagnostic wireframe & transparency modes.
- **Engineering Accuracy**: Auto-calculated clearances, PCB standoffs, and lid tolerances.
- **Pro Export**: Export and download both `.stl` (printing) and `.scad` (manual editing).
- **Free Trial**: 5 free generations for new users via Firebase tracking.

---

## 🛠️ Tech Stack

### Frontend
- **React + Vite**: High-performance UI core.
- **Three.js + R3F**: Real-time 3D model rendering.
- **Tailwind CSS**: Professional, utility-first styling.
- **Framer Motion**: Smooth, high-fidelity animations.
- **Firebase Auth**: Secure Google authentication.
- **Firestore**: User metadata & trial tracking.

### Backend
- **Node.js (Express)**: Unified API foundation.
- **Groq API (Llama 3.3 70B)**: The "Mechanical Mind" reasoning engine.
- **OpenSCAD CLI**: Precision CSG CAD compiler.
- **SQLite**: Local session and credit management.

---

## � Quick Start (Local Setup)

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [OpenSCAD](https://openscad.org/) installed and added to **system PATH**.

### 2. Backend Config
- Navigate to `/server`
- `npm install`
- Add your `GROQ_API_KEY` to `.env`.
- `node index.js` (Server runs on port 5000).

### 3. Frontend Config
- Navigate to `/client`
- `npm install`
- `npm run dev` (Frontend runs on port 5173).

---

## 🏗️ Architecture

1. **Input**: User signs in via Google and submits a prompt.
2. **Reasoning**: AI interprets the description into a **Parametric Design Specification (JSON)**.
3. **Generation**: `cadGenerator.js` converts JSON to a modular, variables-based OpenSCAD script.
4. **Compilation**: OpenSCAD CLI compiles the script into a binary STL file.
5. **Preview**: Three.js renders the STL on a GPU-accelerated canvas for inspection.
6. **Download**: User downloads assets directly from the workspace.

---

## 🏁 Deployment

- **Frontend**: [Netlify](https://www.netlify.com/) (Connected to `main` branch).
- **Backend**: [Render](https://render.com/) (Connected to `main` branch).
- **Database**: Firebase (Auth & Trial status).

---

## 📐 Engineering Specs

- **Min Wall Thickness**: 2.0mm
- **Print Tolerance (Lid)**: 0.4mm
- **Board Clearances**: 1.0mm (standard)
- **Standoff Radius**: 3.5mm

---

Built with ❤️ for the maker community.
