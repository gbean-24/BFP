# Contributing to Tourism Safety Tracker

Thank you for your interest in contributing to the Tourism Safety Tracker! This guide will help you get started with development and collaboration.

## 🚀 Getting Started

### Prerequisites

- Python 3.9 or higher
- Git
- A code editor (VS Code, PyCharm, or Kiro IDE recommended)
- Basic knowledge of FastAPI, SQLAlchemy, and async Python

### Development Setup

1. **Fork and clone the repository:**
```bash
git clone https://github.com/your-username/tourism-safety-tracker.git
cd tourism-safety-tracker
```

2. **Set up your development environment:**
```bash
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

3. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your development settings
```

4. **Run tests to ensure everything works:**
```bash
pytest
```

5. **Start the development server:**
```bash
python main.py
```

## 🏗️ Project Structure & Specifications

This project follows a **spec-driven development** approach using Kiro IDE specifications:

### Key Documents

- **[Requirements](/.kiro/specs/tourism-safety-tracker/requirements.md)**: Detailed user stories and acceptance criteria
- **[Design](/.kiro/specs/tourism-safety-tracker/design.md)**: Technical architecture and component design
- **[Tasks](/.kiro/specs/tourism-safety-tracker/tasks.md)**: Implementation roadmap with specific coding tasks

### Development Workflow

1. **Choose a task** from the [tasks.md](/.kiro/specs/tourism-safety-tracker/tasks.md) file
2. **Read the requirements** and design documents to understand the context
3. **Create a feature branch** for your task
4. **Implement the task** following the specifications
5. **Write tests** for your implementation
6. **Submit a pull request** for review

## 🔧 Development Guidelines

### Code Style

- **Python**: Follow PEP 8 standards
- **Formatting**: Use `black` for code formatting
- **Linting**: Use `flake8` for code linting
- **Type Hints**: Use type hints where possible

```bash
# Format code
black .

# Check linting
flake8 .

# Run type checking (optional)
mypy app/
```

### Testing

- Write tests for all new functionality
- Maintain test coverage above 80%
- Use pytest for testing
- Follow the existing test structure

```bash
# Run all tests
pytest

# Run with coverage report
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_main.py -v
```

### Commit Messages

Use clear, descriptive commit messages:

```
feat: add location tracking service
fix: resolve authentication token expiry issue
docs: update API documentation
test: add tests for emergency alert system
refactor: improve database query performance
```

## 🎯 Working with Tasks

### Task Selection

1. Open [tasks.md](/.kiro/specs/tourism-safety-tracker/tasks.md)
2. Look for tasks marked as `[ ]` (not started)
3. Choose a task that matches your skill level
4. Comment on the task or create an issue to claim it

### Task Implementation

Each task includes:
- **Clear objective**: What needs to be implemented
- **Requirements reference**: Links to specific requirements
- **Implementation details**: Technical guidance

Example task structure:
```markdown
- [ ] 2.1 Create core data model interfaces and types
  - Write TypeScript interfaces for all data models
  - Implement validation functions for data integrity
  - _Requirements: 2.1, 3.3, 1.2_
```

### Using AI Assistants (Kiro, ChatGPT, etc.)

When using AI assistants for development:

1. **Provide context**: Share the relevant requirements and design documents
2. **Reference specifications**: Point the AI to the specific task and requirements
3. **Follow the architecture**: Ensure AI-generated code follows the project structure
4. **Test thoroughly**: Always test AI-generated code before submitting
5. **Review and refactor**: Clean up and optimize AI-generated code as needed

Example prompt for AI:
```
I'm working on Task 2.1 from the tourism safety tracker project. 
Please help me implement the core data models based on the requirements 
in .kiro/specs/tourism-safety-tracker/requirements.md and the design 
in .kiro/specs/tourism-safety-tracker/design.md. Focus on the User and 
Trip models with proper SQLAlchemy relationships.
```

## 🔄 Pull Request Process

### Before Submitting

1. **Update task status**: Mark your task as completed in tasks.md
2. **Run tests**: Ensure all tests pass
3. **Check code quality**: Run black and flake8
4. **Update documentation**: Add/update docstrings and comments
5. **Test manually**: Verify your changes work as expected

### Pull Request Template

```markdown
## Description
Brief description of changes made.

## Task Reference
- Closes task: [Task number and description]
- Related requirements: [Requirement numbers]

## Changes Made
- [ ] Added/modified files
- [ ] Added tests
- [ ] Updated documentation
- [ ] Verified functionality

## Testing
- [ ] All existing tests pass
- [ ] New tests added and passing
- [ ] Manual testing completed

## Screenshots (if applicable)
[Add screenshots for UI changes]
```

### Review Process

1. **Automated checks**: Ensure CI/CD passes
2. **Code review**: At least one team member reviews
3. **Testing**: Reviewer tests the functionality
4. **Approval**: Changes are approved and merged

## 🛠️ Development Tips

### Working with the Database

```python
# Always use async/await for database operations
async def get_user(user_id: int):
    async with get_db_session() as session:
        result = await session.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()
```

### API Development

```python
# Follow FastAPI best practices
@router.post("/users/", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db_session)
):
    # Implementation here
    pass
```

### Error Handling

```python
# Use proper HTTP status codes and error responses
from fastapi import HTTPException, status

if not user:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="User not found"
    )
```

## 🐛 Debugging

### Common Issues

1. **Import errors**: Check virtual environment activation
2. **Database errors**: Verify database URL in .env
3. **Test failures**: Check test database setup
4. **Dependency conflicts**: Update requirements.txt

### Debugging Tools

- **FastAPI docs**: `http://localhost:8000/docs`
- **Database inspection**: Use SQLAlchemy's reflection
- **Logging**: Check application logs
- **Debugger**: Use Python debugger or IDE debugging

## 📞 Getting Help

### Resources

- **Project Documentation**: Check the `/docs` folder
- **Specifications**: Review `.kiro/specs/` for detailed requirements
- **API Docs**: Use the interactive API documentation
- **Tests**: Look at existing tests for examples

### Communication

- **Issues**: Create GitHub issues for bugs or questions
- **Discussions**: Use GitHub discussions for general questions
- **Pull Requests**: Use PR comments for code-specific questions

## 🎉 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to making travel safer for everyone! 🌍✈️