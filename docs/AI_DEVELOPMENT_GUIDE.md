# AI-Assisted Development Guide

This guide helps developers using AI assistants (Kiro IDE, ChatGPT, Claude, etc.) to contribute effectively to the Tourism Safety Tracker project.

## 🤖 Getting Started with AI Development

### Project Context for AI

When working with AI assistants, always provide this context:

```
I'm working on the Tourism Safety Tracker project - a comprehensive safety monitoring application for travelers. The project uses:

- Backend: FastAPI (Python 3.9+)
- Database: SQLAlchemy with SQLite/PostgreSQL
- Architecture: Async/await patterns
- Testing: pytest with async support
- Code Style: Black formatting, PEP 8 standards

Key project files:
- Requirements: .kiro/specs/tourism-safety-tracker/requirements.md
- Design: .kiro/specs/tourism-safety-tracker/design.md  
- Tasks: .kiro/specs/tourism-safety-tracker/tasks.md
- Main app: main.py
- Config: app/config.py
```

### Spec-Driven Development

This project follows a **specification-driven approach**:

1. **Requirements** define WHAT we're building (user stories + acceptance criteria)
2. **Design** defines HOW we're building it (architecture + components)
3. **Tasks** define the step-by-step implementation plan

Always reference these specs when asking AI for help.

## 📋 AI Prompting Best Practices

### Effective Prompts

#### ✅ Good Prompt Example:
```
I'm implementing Task 3.1 from the tourism safety tracker project: "Implement JWT-based authentication with login/register endpoints."

Based on the requirements in .kiro/specs/tourism-safety-tracker/requirements.md (specifically requirement 5.1 about user management) and the design in design.md (User Management Component section), please help me:

1. Create the User SQLAlchemy model with proper relationships
2. Implement JWT token generation and validation
3. Create login and register API endpoints
4. Add proper error handling and validation

The project uses FastAPI, SQLAlchemy async, and follows the existing structure in app/config.py.
```

#### ❌ Poor Prompt Example:
```
Help me create a login system
```

### Context Sharing

When asking for help, share relevant files:

```
Here's the current project structure:
[paste relevant code/files]

And here's the specific requirement I'm implementing:
[paste requirement from requirements.md]

Please help me implement [specific task].
```

## 🎯 Task-Based Development

### Working with Tasks

1. **Choose a task** from [tasks.md](/.kiro/specs/tourism-safety-tracker/tasks.md)
2. **Read the context**: Review related requirements and design sections
3. **Prompt the AI** with full context
4. **Implement incrementally**: Break large tasks into smaller pieces
5. **Test thoroughly**: AI code needs careful testing

### Task Prompt Template

```
I'm working on Task [X.X] from the tourism safety tracker project:

TASK: [Copy exact task description from tasks.md]

REQUIREMENTS: [Reference specific requirements from requirements.md]

DESIGN CONTEXT: [Reference relevant design sections]

CURRENT CODE: [Share relevant existing code]

Please help me implement this following the project's FastAPI + SQLAlchemy async patterns.
```

## 🏗️ Architecture Guidelines for AI

### Database Models

When asking AI to create models, specify:

```python
# Example prompt context:
"""
Create SQLAlchemy models following this pattern:
- Use async sessions
- Include proper relationships
- Add validation
- Follow the User/Trip/Location model structure from design.md
"""

# Expected AI output pattern:
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    # ... rest of model
```

### API Endpoints

Specify FastAPI patterns:

```python
# Example prompt:
"""
Create FastAPI endpoints following this pattern:
- Use proper HTTP status codes
- Include request/response models
- Add proper error handling
- Use dependency injection for database sessions
"""

# Expected pattern:
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/users", tags=["users"])

@router.post("/", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db_session)
):
    # Implementation
```

### Testing Patterns

Request AI to follow testing patterns:

```python
# Example prompt:
"""
Create pytest tests following the project's async testing pattern:
- Use pytest-asyncio
- Mock external services
- Test both success and error cases
- Follow the existing test structure in tests/
"""

# Expected pattern:
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_user(client: AsyncClient):
    response = await client.post("/api/users/", json={
        "email": "test@example.com",
        "password": "testpass123"
    })
    assert response.status_code == 201
```

## 🔧 Common AI Development Scenarios

### Scenario 1: Implementing a New Feature

```
I need to implement the location tracking service (Task 5.1). 

CONTEXT:
- Requirement 2.1: System shall collect GPS coordinates every 5 minutes
- Design: LocationProcessor class with validation and storage
- Existing: app/config.py has location settings

Please create:
1. LocationUpdate Pydantic model
2. LocationService class with async methods
3. API endpoint for receiving location updates
4. Tests for the location service

Follow the existing async patterns and error handling.
```

### Scenario 2: Debugging Issues

```
I'm getting this error when running the location tracking endpoint:
[paste error traceback]

CONTEXT:
- Task 5.1 implementation
- Using the LocationService from design.md
- Current code: [paste relevant code]

The error seems related to async database operations. Please help me fix this following the project's SQLAlchemy async patterns.
```

### Scenario 3: Adding Tests

```
I've implemented the emergency alert system (Task 6.1) and need comprehensive tests.

IMPLEMENTED CODE:
[paste your implementation]

REQUIREMENTS TO TEST:
- Requirement 3.1: System shall send push notification asking "Are you safe?"
- Requirement 3.2: User has 15 minutes to respond
- Requirement 3.3: System logs response and continues monitoring

Please create pytest tests covering all these scenarios, including edge cases and error conditions.
```

## ⚠️ AI Development Pitfalls to Avoid

### Common Issues

1. **Missing Context**: AI generates generic code without project-specific patterns
2. **Outdated Patterns**: AI uses old FastAPI/SQLAlchemy patterns
3. **Missing Error Handling**: AI forgets proper HTTP status codes and error responses
4. **Sync vs Async**: AI mixes sync and async patterns incorrectly
5. **Missing Tests**: AI doesn't include comprehensive test coverage

### Prevention Strategies

1. **Always provide project context** and existing code examples
2. **Specify async patterns** explicitly in prompts
3. **Request error handling** and proper HTTP responses
4. **Ask for tests** as part of implementation
5. **Review and refactor** AI-generated code before committing

## 🧪 Testing AI-Generated Code

### Validation Checklist

- [ ] Code follows project structure and patterns
- [ ] Async/await used correctly
- [ ] Proper error handling with HTTP status codes
- [ ] Database operations use async sessions
- [ ] Tests cover success and error cases
- [ ] Code passes linting (black, flake8)
- [ ] All tests pass
- [ ] Manual testing confirms functionality

### Testing Commands

```bash
# Format code
black .

# Check linting
flake8 .

# Run tests
pytest -v

# Run with coverage
pytest --cov=app

# Test specific functionality
pytest tests/test_location.py -v
```

## 🚀 Advanced AI Techniques

### Iterative Development

1. **Start small**: Ask AI for basic structure first
2. **Add complexity**: Gradually add features and error handling
3. **Refine**: Ask AI to optimize and improve the code
4. **Test**: Validate each iteration thoroughly

### Code Review with AI

```
Please review this implementation of the emergency alert system:

[paste code]

Check for:
1. Adherence to project patterns
2. Proper async/await usage
3. Error handling completeness
4. Security considerations
5. Performance optimizations
6. Test coverage gaps

Suggest improvements following the project's design principles.
```

### Documentation Generation

```
Based on this implementation of the location tracking service:

[paste code]

Please generate:
1. Docstrings for all functions and classes
2. API documentation examples
3. Usage examples for other developers
4. Error handling documentation

Follow the project's documentation style.
```

## 📚 Resources for AI Development

### Key Files to Reference

- **Project Structure**: `README.md`
- **Requirements**: `.kiro/specs/tourism-safety-tracker/requirements.md`
- **Design**: `.kiro/specs/tourism-safety-tracker/design.md`
- **Tasks**: `.kiro/specs/tourism-safety-tracker/tasks.md`
- **Configuration**: `app/config.py`
- **Main App**: `main.py`
- **Test Examples**: `tests/test_main.py`

### External Documentation

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Async Documentation](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)
- [Pytest Async Documentation](https://pytest-asyncio.readthedocs.io/)
- [Pydantic Documentation](https://docs.pydantic.dev/)

## 🎯 Success Metrics

Your AI-assisted development is successful when:

- [ ] Code follows project specifications exactly
- [ ] Implementation matches the design architecture
- [ ] All requirements are satisfied
- [ ] Tests provide comprehensive coverage
- [ ] Code passes all quality checks
- [ ] Manual testing confirms functionality
- [ ] Documentation is clear and complete

Remember: AI is a powerful tool, but human oversight and testing are essential for quality code! 🚀