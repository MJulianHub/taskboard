# TaskBoard

A project management application built with Rails 8 + React + Vite.

## Prerequisites

- Ruby 3.4+
- Node.js 18+
- SQLite3

## Setup

```bash
# Install Ruby dependencies
bundle install

# Install Node dependencies
npm install

# Build frontend assets (required for production)
npm run build

# Setup database
bin/rails db:create db:migrate

# Create test user (optional)
bin/rails runner "User.create!(email: 'test@test.com', password: 'password', password_confirmation: 'password', first_name: 'Test', last_name: 'User')"
```

## Running

```bash
# Development (two terminals)

# Terminal 1: Rails server
bin/rails server -p 3000

# Terminal 2: Vite dev server
npm run dev
```

Then open http://localhost:5173

## Test Credentials

- Email: `test@test.com`
- Password: `password`

## Deployment

Build assets are not committed. When deploying with Kamal, ensure `npm run build` is run during deployment.
