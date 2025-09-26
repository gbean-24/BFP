# Tourism Safety Tracker 🛡️

A comprehensive safety monitoring application for travelers that provides real-time location tracking, emergency alerts, and automatic emergency service contact.

[![Python](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 🌟 Features

- **🗺️ Trip Planning**: Define travel itineraries with planned locations and routes
- **📍 Real-time Monitoring**: Continuous GPS tracking with deviation detection
- **🚨 Safety Alerts**: Automatic alerts when users deviate from planned routes
- **🆘 Emergency Response**: Automatic emergency service contact if users don't respond
- **👥 Location Sharing**: Share real-time location with travel companions
- **📱 Offline Support**: Works in areas with limited connectivity
- **🔒 Secure**: JWT authentication and encrypted data storage

## 🚀 Quick Start

### Prerequisites

- Python 3.9 or higher
- pip (Python package manager)
- Git

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/your-username/tourism-safety-tracker.git
cd tourism-safety-tracker
```

2. **Create a virtual environment:**
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python -m venv venv
source venv/bin/activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration (see Configuration section)
```

5. **Run the application:**
```bash
python main.py
```

The application will be available at `http://localhost:8000`

### 📚 API Documentation

When running in development mode, interactive API documentation is available at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 🛠️ Development

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_main.py -v
```

### Code Quality

```bash
# Format code
black .

# Lint code
flake8 .

# Type checking (optional)
mypy app/
```

### Project Structure

```
tourism-safety-tracker/
├── .kiro/                    # Kiro IDE specifications
│   └── specs/
│       └── tourism-safety-tracker/
│           ├── requirements.md
│           ├── design.md
│           └── tasks.md
├── app/                      # Main application code
│   ├── __init__.py
│   ├── config.py            # Configuration management
│   ├── models/              # Database models
│   ├── services/            # Business logic
│   └── api/                 # API routes
├── tests/                   # Test suite
├── static/                  # Static files (CSS, JS)
├── templates/               # HTML templates
├── main.py                  # Application entry point
├── requirements.txt         # Core dependencies
├── requirements-optional.txt # Optional dependencies
└── docs/                    # Documentation
```

## ⚙️ Configuration

Key configuration options in `.env`:

```env
# Database
DATABASE_URL=sqlite:///./tourism_tracker.db

# Security
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# External Services (Optional)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
SENDGRID_API_KEY=your_sendgrid_api_key

# Emergency Settings
EMERGENCY_TIMEOUT_MINUTES=15
LOCATION_CHECK_INTERVAL_MINUTES=5
DEVIATION_THRESHOLD_METERS=2000
```

## 🏗️ Architecture

- **Backend**: FastAPI (Python) - High-performance async API
- **Database**: SQLAlchemy with SQLite (dev) / PostgreSQL (prod)
- **Frontend**: Progressive Web App (PWA)
- **Real-time**: WebSocket connections for live updates
- **Background Tasks**: Celery with Redis (optional)
- **Notifications**: Multi-channel (Push, SMS, Email)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`pytest`)
6. Format code (`black .`)
7. Commit your changes (`git commit -m 'Add amazing feature'`)
8. Push to the branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

## 📋 Roadmap

See our [Project Tasks](/.kiro/specs/tourism-safety-tracker/tasks.md) for the current development roadmap and implementation plan.

## 🐛 Issues & Support

- **Bug Reports**: [Create an issue](https://github.com/your-username/tourism-safety-tracker/issues)
- **Feature Requests**: [Create an issue](https://github.com/your-username/tourism-safety-tracker/issues)
- **Questions**: [Discussions](https://github.com/your-username/tourism-safety-tracker/discussions)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- Location services powered by [OpenStreetMap](https://www.openstreetmap.org/)
- Developed with [Kiro IDE](https://kiro.ai/) for AI-assisted development