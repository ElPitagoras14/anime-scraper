# Agent Coding Guidelines

This document outlines the essential commands and code style guidelines for agentic coding in this repository.

## 1. Build/Lint/Test Commands

### Frontend (Next.js, TypeScript)
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Test**: `npm test` (Assumed, as no explicit script found. May require `jest` or `react-testing-library` setup.)
- **Run Single Test**: `npm test -- <path-to-test-file>` (Assumed for `npm test`)

### Backend (FastAPI, Python)
- **Install Dependencies**: `uv pip install -r requirements.txt`
- **Lint**: `ruff check .` (Assumed, common Python linter)
- **Test**: `pytest` (Assumed, common Python test runner)
- **Run Single Test**: `pytest <path-to-test-file>` (Assumed for `pytest`)

### Queue (Celery, Python)
- **Install Dependencies**: `uv pip install -r requirements.txt`
- **Lint**: `ruff check .` (Assumed, common Python linter)
- **Test**: `pytest` (Assumed, common Python test runner)
- **Run Single Test**: `pytest <path-to-test-file>` (Assumed for `pytest`)

## 2. Code Style Guidelines

### General
- **Formatting**: Adhere to existing file formatting. Use Prettier for frontend if configured. For Python, Black or Ruff are likely used.
- **Imports**: Organize imports logically (e.g., standard library, third-party, local).
- **Naming Conventions**:
    - **Python**: `snake_case` for variables, functions, and modules; `PascalCase` for classes.
    - **TypeScript/JavaScript**: `camelCase` for variables and functions; `PascalCase` for components and types.
- **Types**: Utilize TypeScript for frontend and type hints for Python where applicable.
- **Error Handling**: Implement robust error handling with clear exceptions/error messages.

### Specifics
- **Frontend**: Follow Next.js and React best practices.
- **Python**: Adhere to PEP 8.
