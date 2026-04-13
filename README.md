# Voraparivar: Family Tree App

A React + TypeScript + Vite application for managing and visualizing a family tree.

## Getting Started

1. Clone the repository:

    ```bash
    git clone https://github.com/r4021ram-design/voraparivar.git
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Run the development server:

    ```bash
    npm run dev
    ```

## Features

- Family tree visualization
- Member details management
- Search functionality
- Supabase integration

## Documentation

For a deeper dive into how this app is structured, see the following documentation:
- [Architecture](docs/architecture.md)
- [Data Flow](docs/data-flow.md)
- [Tree Model](docs/tree-model.md)
- [Refactoring History](docs/refactor-history.md)

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS

## Deployment

### Netlify

1. Connect your GitHub repository to Netlify.
2. **Build Command:** `npm run build`
3. **Publish Directory:** `dist`
4. **Environment Variables:**
    - `VITE_SUPABASE_URL`: Your Supabase Project URL
    - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key
