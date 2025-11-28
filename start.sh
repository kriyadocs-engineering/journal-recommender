#!/bin/bash

echo "========================================"
echo "  Journal Recommender Application"
echo "========================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Start PostgreSQL
echo "1. Starting PostgreSQL database..."
docker-compose up -d postgres
echo "   Waiting for database to be ready..."
sleep 5

# Check database connection
echo "2. Checking database connection..."
until docker-compose exec -T postgres pg_isready -U journal_user -d journal_recommender > /dev/null 2>&1; do
    echo "   Waiting for PostgreSQL..."
    sleep 2
done
echo "   Database is ready!"

# Install backend dependencies if needed
echo "3. Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
fi

# Seed database
echo "4. Seeding database with journal data..."
npm run db:seed

# Start backend in background
echo "5. Starting backend server..."
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend
sleep 3

# Install frontend dependencies if needed
echo "6. Installing frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
fi

# Start frontend
echo "7. Starting frontend..."
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "========================================"
echo "  Application is starting!"
echo "========================================"
echo ""
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3001"
echo "  Database: localhost:5432"
echo ""
echo "  Press Ctrl+C to stop all services"
echo ""

# Handle cleanup
cleanup() {
    echo ""
    echo "Shutting down services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    docker-compose down
    echo "Done!"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for processes
wait
