#!/bin/bash

# Therapy Case Management System - Development Server Launcher
echo "🚀 Starting Therapy Case Management System..."
echo "============================================="

# Function to handle cleanup on script exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    # Kill all background jobs started by this script
    jobs -p | xargs -r kill
    exit 0
}

# Set trap to handle Ctrl+C
trap cleanup SIGINT SIGTERM

# Check if .env files exist
if [ ! -f server/.env ]; then
    echo "❌ server/.env not found. Please run ./setup.sh first or copy from .env.example"
    exit 1
fi

if [ ! -f frontend/.env.local ]; then
    echo "❌ frontend/.env.local not found. Please run ./setup.sh first or copy from .env.example"
    exit 1
fi

# Start backend server
echo "🔧 Starting backend server (Node.js + Express)..."
cd server
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "⚛️  Starting frontend server (React + Vite)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Both servers are starting..."
echo ""
echo "🌐 Access URLs:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:4000"
echo "   Health:   http://localhost:4000/health"
echo ""
echo "📋 Quick Commands:"
echo "   Seed data: cd server && npm run seed"
echo "   View logs: Check terminal output above"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for background processes
wait $BACKEND_PID $FRONTEND_PID
