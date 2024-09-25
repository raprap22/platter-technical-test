# Platter Technical Test

This project consists of four microservices running in Docker containers:
- Product Service
- Payment Service
- User Service
- Notification Service

## How to Run

1. Clone the repository.
2. Run `docker-compose up` to start all services.
3. The services will be available on the following ports:
   - Product: 9301
   - Payment: 9302
   - User: 2323
   - Notification: 9304

Make sure to have Docker installed and running.

## Services

- **Product Service**: Manages product inventory and initiates payments.
- **Payment Service**: Handles payment transactions.
- **User Service**: Receives notifications via WebSocket.
- **Notification Service**: Sends notifications to the user.