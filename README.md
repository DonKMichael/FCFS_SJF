# FCFS & SJF Scheduling Visualizer

## Overview

FCFS & SJF Scheduling Visualizer is a frontend application that demonstrates CPU scheduling algorithms, specifically First Come First Serve (FCFS) and Shortest Job First (SJF). The application provides an interactive interface to input processes and visualize scheduling behavior, helping users understand execution order and performance metrics.

The project is built using React, TypeScript, and Vite, following a modular and scalable architecture.

## Tech Stack

* React
* TypeScript
* Vite
* CSS

## Project Structure

```
.
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   └── index.css
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
└── metadata.json
```

## Features

* Implementation of FCFS scheduling algorithm
* Implementation of SJF scheduling algorithm
* Interactive process input
* Clear visualization of execution order
* Type-safe development using TypeScript
* Fast build and development workflow using Vite

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/DonKMichael/FCFS_SJF.git
   cd FCFS_SJF
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

## Environment Setup

1. Copy the environment example file:

   ```bash
   cp .env.example .env
   ```

2. Update environment variables if required.

## Available Scripts

* `npm run dev` – Starts the development server
* `npm run build` – Builds the project for production
* `npm run preview` – Previews the production build locally

## Build and Deployment

To create a production build:

```bash
npm run build
```

The production-ready files will be generated in the `dist` directory. Deploy the contents of this directory to your preferred hosting platform.

## Contributing

1. Fork the repository.
2. Create a new branch for your feature or fix.
3. Commit changes with clear and descriptive messages.
4. Submit a pull request for review.
