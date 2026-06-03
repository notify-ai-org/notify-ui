<p align="center">
  <span style="font-size: 50px;">⚡</span>
</p>
<h1 align="center" style="border-bottom: none;">
  <span style="background: linear-gradient(135deg, #eab308 0%, #f97316 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800;">Notify.ai</span>
</h1>
<p align="center"><b>UI Portals</b> — React Microfrontends and Administrative Interfaces</p>

---

## 📖 Overview

The `notify-ui` directory contains the modular frontend application stack for **Notify.ai**. Built as a collection of React microfrontends powered by **Vite** and styled using vanilla CSS, it provides administrators with deep insights into event streams, agent reasoning, DLQ management, rules configurations, and template designs.

## 🏗️ Folder Structure

- **`dev`**: The local development shell which imports and links all portals inside a single routing container.
- **`shared`**: A shared library package housing common API configuration, interceptors, context modals, custom hooks, and Redux store state.
- **Portals (Microfrontends)**:
  - `home`: The landing/welcome dashboard.
  - `events`: Active event streams and capture metrics.
  - `templates`: Interactive template editor and variable injector.
  - `memory`: Fact-graph visualizer representing extracted user context.
  - `dead-letters`: Replay and management interface for failed notification jobs.
  - `login`: Interactive login portal supporting Google Sign-In.
  - `settings`: Global configuration overrides.
  - `vocab-rules`: Vocabulary rule definitions editor.
  - `sdk-guide`: In-app documentation and SDK usage manuals.

## 🚀 Running Locally

### 1. Dev Server (Recommended for Development)
To launch a hot-reloading development server containing all portals:
```bash
# Navigate to the dev directory
cd notify-ui/dev

# Install dependencies
npm install

# Start the dev server
npm run dev
```
By default, the Vite dev server will run on `http://localhost:5173` (or the next available port). Make sure the Spring Boot backend (`access` module) is running on `http://localhost:8080` to proxy API requests.

### 2. Building Portals (For Local/Production Deployments)
To build all portals and copy the production assets directly into the Spring Boot resource directory:
```bash
# Run the build-all shell script from the repository root
./notify-ui/build-all.sh
```
This script will build the shared package first, run parallel builds for all microfrontend portals, and copy the compiled assets into `access/src/main/resources/static/portals/`.

---

## 👥 Developer Contact & Contributing

For questions, issues, or support regarding this module:
- **Lead Developer**: Rohan Naik ([rohan.naik07@github](https://github.com/rohan-naik07))
- **Email**: dev-support@notify.ai

### Contributing

We welcome contributions! Please follow these guidelines:
1. **Fork** the repository and create your branch from `master`.
2. Ensure you format all files using standard Prettier rules.
3. Test code builds locally via `npm run build` before sending pull requests.
4. Submit a **Pull Request** with a detailed description of your changes.
