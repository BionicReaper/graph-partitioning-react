# Graph Partitioning Visualizer

An interactive web application to help students understand graph partitioning algorithms. Built with React, TypeScript, and Chakra UI.

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **UI Framework**: Chakra UI
- **Icons**: Lucide React
- **Graph Visualization**: vis.js/vis-network
- **Build Tool**: Vite
- **Backend**: Node.js + Express (for heavy computations if needed)

## Project Structure

```
graph-partioning-react/
├── frontend/          # React + TypeScript application
│   ├── src/
│   │   ├── components/
│   │   │   ├── GraphCanvas.tsx       # Vis.js graph visualization
│   │   │   ├── Sidebar.tsx           # Chakra UI sidebar with drawer
│   │   │   └── AddNodeButton.tsx     # Chakra UI floating action button
│   │   ├── types/
│   │   │   └── graph.ts              # TypeScript type definitions
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── backend/           # Node.js server (for heavy computations if needed)
    ├── server.js
    └── package.json
```

## Getting Started

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and visit `http://localhost:3000`

### Backend Setup (Optional)

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```

The backend server will run on `http://localhost:5000`

## Features

- **Full-screen Graph Canvas**: Powered by vis.js for interactive graph visualization
- **Modern UI Components**: Built with Chakra UI for a polished, professional look
- **Chakra UI Drawer**: Smooth sliding sidebar with overlay effect
- **Floating Action Buttons**: Hamburger menu (bottom left) and Add Node (bottom right)
- **Type Safety**: Full TypeScript support for better development experience
- **Interactive Nodes**: Drag nodes to reposition, click two nodes to create edges
- **Zoom & Pan**: Scroll to zoom, drag to pan around the canvas

## Future Development

- Implement graph partitioning algorithms (Kernighan-Lin, Fiduccia-Mattheyses, etc.)
- Add visualization of partitioning steps
- Export/import graph data
- Algorithm comparison tools
