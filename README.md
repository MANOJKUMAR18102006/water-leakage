# AquaGrid AI Simulation
Software-only demo of 3-zone water pipeline monitoring, leak detection, localization and simulated valve isolation.

## Run
1. Install Node.js 18+.
2. Terminal 1: `cd server` → `npm install` → `npm run dev`
3. Terminal 2: `cd client` → `npm install` → `npm run dev`
4. Open http://localhost:5173
5. Choose Normal / Small leak / Major leak, then Start simulation.

Backend: http://localhost:5000. MongoDB is optional; without MONGO_URI the server stores data in memory.
This is simulated data, not a physical sensor or real valve controller.
