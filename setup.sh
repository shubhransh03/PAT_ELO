#!/bin/bash

# Therapy Case Management System - Quick Setup Script
echo "🏥 Therapy Case Management System - Quick Setup"
echo "================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v20.19+ or v22.12+"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
echo "✅ Node.js version: $NODE_VERSION"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd server
if [ ! -f .env ]; then
    echo "📝 Creating backend .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit server/.env with your MongoDB URI and Clerk secret key"
fi
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
if [ ! -f .env.local ]; then
    echo "📝 Creating frontend .env.local file from template..."
    cp .env.example .env.local
    echo "⚠️  Please edit frontend/.env.local with your Clerk publishable key"
fi
npm install

# Return to root directory
cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit server/.env with your MongoDB URI and Clerk secret key"
echo "2. Edit frontend/.env.local with your Clerk publishable key"
echo "3. Start the development servers:"
echo ""
echo "   Backend:  cd server && npm run dev"
echo "   Frontend: cd frontend && npm run dev"
echo ""
echo "4. (Optional) Seed sample data: cd server && npm run seed"
echo ""
echo "🌐 Access the application:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:4000"
echo "   Health:   http://localhost:4000/health"
echo ""
echo "📚 See README.md for detailed documentation"
