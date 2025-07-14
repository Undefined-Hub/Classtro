# Backend Project Documentation

This README outlines the folder structure and purpose of files in the backend project.

---

## **Folder Structure**

```
project-folder/
├── config/
│   ├── db.js
│   └── env.js
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   └── leaveController.js
├── middlewares/
│   ├── authMiddleware.js
│   ├── errorHandler.js
├── models/
│   ├── User.js
│   └── LeaveRequest.js
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   └── leaveRoutes.js
├── utils/
│   ├── jwtHelper.js
│   ├── validateInput.js
├── .env
├── app.js
├── server.js
├── package.json
└── README.md
```

---

### **1. Root Files**

- **`server.js`**: Entry point for the application. It starts the Express server and listens for incoming requests.
- **`app.js`**: Configures the main Express application. This includes middleware setup, routes, and error handling.
- **`.env`**: Stores environment variables such as database connection strings and secret keys.
- **`package.json`**: Manages dependencies, scripts, and project metadata.
- **`README.md`**: Project documentation and overview.

---

### **2. `config/`**

- **`db.js`**: Manages the database connection using Mongoose. Ensures a single source of truth for database setup.
- **`env.js`**: (Optional) Centralized configuration for environment variables.

---

### **3. `controllers/`**

Handles the business logic for different parts of the application.

- **`authController.js`**: Contains logic for user authentication, including login and registration.
- **`userController.js`**: Manages user-related operations such as retrieving user details.
- **`leaveController.js`**: Handles leave request functionality, including submission, updates, and retrieval.

---

### **4. `middlewares/`**

Custom middleware for the application.

- **`authMiddleware.js`**: Verifies user authentication and authorization for protected routes.
- **`errorHandler.js`**: A centralized error-handling middleware to catch and respond to application errors.

---

### **5. `models/`**

Defines the MongoDB schemas and models using Mongoose.

- **`User.js`**: Defines the schema for user information, including name, email, password, and role.
- **`LeaveRequest.js`**: Defines the schema for leave requests, including user ID, date range, reason, and status.

---

### **6. `routes/`**

Defines the API endpoints and maps them to their respective controllers.

- **`authRoutes.js`**: Endpoints for authentication (e.g., `/login`, `/register`).
- **`userRoutes.js`**: Endpoints for user-related operations (e.g., `/profile`, `/update`).
- **`leaveRoutes.js`**: Endpoints for leave management (e.g., `/request`, `/status`).

---

### **7. `utils/`**

Reusable helper functions and utilities.

- **`jwtHelper.js`**: Utility functions for generating and verifying JSON Web Tokens (JWT).
- **`validateInput.js`**: Validates user input to ensure data integrity and security.

---

### **Key Features of the Structure**

1. **Separation of Concerns**: Code is organized into specific folders for better maintainability.
2. **Scalability**: Adding new features is easy without cluttering existing code.
3. **Reusability**: Common logic and utilities are centralized in `middlewares` and `utils`.
4. **Security**: Sensitive information is stored securely in `.env`, and authentication logic is encapsulated.

---

Feel free to modify this structure to suit the specific needs of your project.

