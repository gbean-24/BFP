# Quick Start Guide 🚀

Get up and running with the Tourism Safety Tracker in 5 minutes!

## 🎯 For New Team Members

### 1. Clone and Setup (2 minutes)
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/tourism-safety-tracker.git
cd tourism-safety-tracker

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment (1 minute)
```bash
# Copy environment template
cp .env.example .env

# Edit .env if needed (optional for basic development)
# The defaults work fine for local development
```

### 3. Test Everything Works (1 minute)
```bash
# Run tests
pytest

# Start the application
python main.py
```

### 4. Verify Setup (1 minute)
Open your browser and visit:
- **Application**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

You should see the API documentation and a healthy response!

## 🤖 For AI-Assisted Development

### Quick AI Context
Copy and paste this context when working with AI assistants:

```
I'm working on the Tourism Safety Tracker project - a comprehensive safety monitoring application for travelers.

PROJECT CONTEXT:
- Backend: FastAPI (Python 3.9+) with async/await patterns
- Database: SQLAlchemy with SQLite (dev) / PostgreSQL (prod)
- Testing: pytest with async support
- Code Style: Black formatting, PEP 8 standards

KEY FILES:
- Requirements: .kiro/specs/tourism-safety-tracker/requirements.md
- Design: .kiro/specs/tourism-safety-tracker/design.md
- Tasks: .kiro/specs/tourism-safety-tracker/tasks.md
- Config: app/config.py
- Main: main.py

DEVELOPMENT APPROACH:
- Spec-driven development (requirements → design → tasks)
- Test-driven development
- Async/await patterns throughout
- Proper error handling with HTTP status codes

I'm working on [SPECIFIC TASK] and need help with [SPECIFIC REQUEST].
```

### Choose Your First Task
1. Open `.kiro/specs/tourism-safety-tracker/tasks.md`
2. Find a task marked `[ ]` (not started)
3. Read the related requirements and design sections
4. Ask AI to help implement it!

## 📚 Essential Reading (5 minutes)

### Must-Read Documents
1. **[Project Overview](../README.md)** - What we're building
2. **[Requirements](.kiro/specs/tourism-safety-tracker/requirements.md)** - User stories and acceptance criteria
3. **[Design](.kiro/specs/tourism-safety-tracker/design.md)** - Technical architecture
4. **[Tasks](.kiro/specs/tourism-safety-tracker/tasks.md)** - Implementation roadmap

### Development Guides
- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute
- **[AI Development Guide](AI_DEVELOPMENT_GUIDE.md)** - Using AI assistants effectively

## 🎯 Your First Contribution

### Step 1: Pick a Task
Good starter tasks:
- Task 2: Implement core data models
- Task 3: Build authentication system
- Task 4: Create trip management functionality

### Step 2: Create a Branch
```bash
git checkout -b feature/task-2-data-models
```

### Step 3: Implement with AI
Use the AI context above and ask for help implementing your chosen task.

### Step 4: Test and Submit
```bash
# Run tests
pytest

# Format code
black .

# Check linting
flake8 .

# Commit changes
git add .
git commit -m "feat: implement core data models (Task 2)"

# Push and create PR
git push origin feature/task-2-data-models
```

## 🔧 Development Commands

### Daily Development
```bash
# Start development server
python main.py

# Run tests
pytest

# Run tests with coverage
pytest --cov=app

# Format code
black .

# Check code quality
flake8 .
```

### Database Operations
```bash
# Create migration (when you add models)
alembic revision --autogenerate -m "Add user model"

# Apply migrations
alembic upgrade head

# Reset database (development only)
rm tourism_tracker.db
alembic upgrade head
```

## 🐛 Troubleshooting

### Common Issues

**"Module not found" errors:**
```bash
# Make sure virtual environment is activated
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

**Database errors:**
```bash
# Reset database
rm tourism_tracker.db
alembic upgrade head
```

**Tests failing:**
```bash
# Check if all dependencies installed
pip install -r requirements.txt

# Run specific test
pytest tests/test_main.py -v
```

**Import errors in tests:**
```bash
# Make sure you're in the project root directory
pwd  # Should show your project directory

# Run tests from project root
pytest
```

## 🎉 You're Ready!

You now have:
- ✅ Working development environment
- ✅ Understanding of project structure
- ✅ Knowledge of development workflow
- ✅ AI assistant context for effective coding

## 📞 Getting Help

- **Questions**: Create GitHub issues
- **Discussions**: Use GitHub discussions
- **Documentation**: Check `/docs` folder
- **AI Help**: Use the AI Development Guide

Happy coding! 🚀