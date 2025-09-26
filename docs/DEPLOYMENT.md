# Deployment Guide

This guide covers deploying the Tourism Safety Tracker application to various environments.

## 🚀 Quick Deploy Options

### Option 1: Local Development
```bash
python main.py
```
Access at: `http://localhost:8000`

### Option 2: Production with Gunicorn
```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Option 3: Docker (Coming Soon)
```bash
docker build -t tourism-safety-tracker .
docker run -p 8000:8000 tourism-safety-tracker
```

## 🔧 Environment Configuration

### Development (.env)
```env
DEBUG=True
DATABASE_URL=sqlite:///./tourism_tracker.db
SECRET_KEY=dev-secret-key
LOG_LEVEL=DEBUG
```

### Production (.env)
```env
DEBUG=False
DATABASE_URL=postgresql://user:password@localhost/tourism_tracker
SECRET_KEY=your-super-secure-secret-key
LOG_LEVEL=INFO
CORS_ORIGINS=["https://yourdomain.com"]
```

## 📋 Pre-Deployment Checklist

- [ ] All tests pass (`pytest`)
- [ ] Code is formatted (`black .`)
- [ ] No linting errors (`flake8 .`)
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] External services configured (Twilio, SendGrid, etc.)
- [ ] Security settings reviewed
- [ ] Monitoring and logging configured

## 🔒 Security Considerations

### Production Security
- Use strong SECRET_KEY (generate with `openssl rand -hex 32`)
- Enable HTTPS in production
- Configure CORS origins properly
- Use environment variables for sensitive data
- Regular security updates

### Database Security
- Use PostgreSQL in production
- Enable SSL connections
- Regular backups
- Access control and authentication

## 📊 Monitoring

### Health Checks
- Endpoint: `GET /health`
- Expected response: `{"status": "healthy", "version": "0.1.0"}`

### Logging
- Application logs: Check LOG_LEVEL setting
- Error tracking: Consider integrating Sentry
- Performance monitoring: Monitor response times

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: 3.9
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
    - name: Run tests
      run: |
        pytest --cov=app
    - name: Lint code
      run: |
        black --check .
        flake8 .
```

## 🗄️ Database Setup

### SQLite (Development)
```python
# Automatic setup - no additional configuration needed
DATABASE_URL=sqlite:///./tourism_tracker.db
```

### PostgreSQL (Production)
```bash
# Install PostgreSQL
# Create database
createdb tourism_tracker

# Update .env
DATABASE_URL=postgresql://user:password@localhost/tourism_tracker

# Run migrations
alembic upgrade head
```

## 🌐 External Services Setup

### Twilio (SMS Notifications)
1. Create Twilio account
2. Get Account SID and Auth Token
3. Purchase phone number
4. Update .env:
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

### SendGrid (Email Notifications)
1. Create SendGrid account
2. Generate API key
3. Update .env:
```env
SENDGRID_API_KEY=your_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### Firebase (Push Notifications)
1. Create Firebase project
2. Download service account key
3. Update .env:
```env
FIREBASE_CREDENTIALS_PATH=path/to/firebase-credentials.json
```

## 📱 Frontend Deployment

### Static Files
- CSS/JS files in `/static` directory
- Served automatically by FastAPI
- Consider CDN for production

### Progressive Web App (PWA)
- Service worker for offline functionality
- Web app manifest for mobile installation
- Push notification support

## 🔧 Troubleshooting

### Common Issues

1. **Import Errors**
   - Check virtual environment activation
   - Verify all dependencies installed

2. **Database Connection**
   - Verify DATABASE_URL format
   - Check database server status
   - Ensure database exists

3. **External Service Errors**
   - Verify API keys and credentials
   - Check service status
   - Review rate limits

4. **Performance Issues**
   - Monitor database query performance
   - Check memory usage
   - Review async/await patterns

### Debug Commands
```bash
# Check application health
curl http://localhost:8000/health

# View logs
tail -f app.log

# Test database connection
python -c "from app.config import settings; print(settings.database_url)"

# Run in debug mode
python main.py --debug
```

## 📈 Scaling Considerations

### Horizontal Scaling
- Use load balancer (nginx, HAProxy)
- Multiple application instances
- Shared database and Redis

### Database Scaling
- Read replicas for read-heavy workloads
- Connection pooling
- Query optimization

### Caching
- Redis for session storage
- Application-level caching
- CDN for static assets

## 🔄 Backup and Recovery

### Database Backups
```bash
# PostgreSQL backup
pg_dump tourism_tracker > backup.sql

# Restore
psql tourism_tracker < backup.sql
```

### Application Backups
- Code: Git repository
- Configuration: Environment variables
- Data: Database backups
- Files: Static assets and uploads

## 📞 Support and Maintenance

### Regular Maintenance
- [ ] Security updates
- [ ] Dependency updates
- [ ] Database maintenance
- [ ] Log rotation
- [ ] Performance monitoring
- [ ] Backup verification

### Emergency Procedures
1. **Service Down**: Check health endpoint, restart service
2. **Database Issues**: Check connections, review logs
3. **High Load**: Scale horizontally, optimize queries
4. **Security Incident**: Review logs, update credentials

For deployment support, create an issue in the GitHub repository.