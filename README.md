# EnclosureAI 🚀

**AI-powered conversion of device descriptions into 3D-printable enclosure STL files.**

```
User text → Gemini AI → JSON design plan → OpenSCAD code → STL file → Download
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **AI Design Engine** | Gemini 2.0 Flash generates structured JSON design plans from natural language |
| **Parametric CAD** | Fully parametric OpenSCAD code with accurate port cutouts, screw posts, vents, and lids |
| **Port Library** | USB, USB-C, Micro USB, HDMI, Ethernet, audio jack, SD card cutout dimensions built-in |
| **Credit System** | SQLite-based — 5 free generations per user |
| **Modern UI** | Dark glassmorphism React interface with pipeline status indicators |
| **Dual Download** | Download both `.stl` (for printing) and `.scad` (for editing in OpenSCAD) |

---

## 🛠️ Prerequisites

1. **[Node.js](https://nodejs.org/)** v18+
2. **[OpenSCAD](https://openscad.org/downloads.html)** — install and **add to your system PATH**
   - Verify: `openscad -v` should print a version number
   - On Windows, the installer may not add it to PATH — you can manually add `C:\Program Files\OpenSCAD` to your system PATH

---

## 🚀 Quick Start

### 1. Backend

```bash
cd enclosure-ai/server
npm install
npm start
```

Server starts on `http://localhost:5000`.

### 2. Frontend

```bash
cd enclosure-ai/client
npm install
npm run dev
```

Frontend starts on `http://localhost:5173`.

### 3. Open in browser

Go to **http://localhost:5173** and enter a device description.

---

## 🧪 Test Prompts

Try these in the text box:

- *"A handheld case for Arduino Nano with front USB opening and ventilation holes."*
- *"Desktop enclosure for Raspberry Pi 4 with side HDMI and power ports, top vents, and screw-on lid."*
- *"Small wall-mount sensor box for ESP32 with one USB-C port on the back."*
- *"Battery-powered GPS tracker case with front LED cutout and bottom vents."*

---

## 📂 Project Structure

```
enclosure-ai/
├── server/
│   ├── index.js           # Express API + pipeline orchestration
│   ├── geminiClient.js    # Gemini API + JSON schema enforcement
│   ├── cadGenerator.js    # JSON → OpenSCAD code generator
│   ├── credits.js         # SQLite credit system
│   └── .env               # API keys (not committed)
├── client/
│   ├── src/
│   │   ├── App.jsx        # React UI
│   │   ├── main.jsx       # Entry point
│   │   └── index.css      # Design system
│   ├── index.html
│   └── vite.config.js
└── outputs/               # Generated .scad and .stl files
```

---

## ⚙️ Architecture

```
User Prompt
    ↓
Express API (/api/generate)
    ↓
Gemini 2.0 Flash (structured JSON output with schema enforcement)
    ↓
cadGenerator.js (JSON → parametric OpenSCAD code)
    ↓
OpenSCAD CLI (openscad design.scad -o output.stl)
    ↓
STL file served via Express static
    ↓
React frontend download link
```

---

## 🔑 Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key |
| `PORT` | Server port (default: 5000) |

---

## 📐 CAD Generation Rules

- **Minimum wall thickness**: 2mm
- **Clearance**: 0.5mm between lid and box
- **Screw posts**: 4mm radius, M3 pilot holes (1.5mm)
- **Lid screw holes**: 1.8mm (clearance fit)
- **Vent slots**: 2mm width, 4mm spacing
- **Port dimensions**: Accurate to real connector specs

---

## 📄 License

MIT
