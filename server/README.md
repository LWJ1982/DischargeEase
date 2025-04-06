# DischargeEase
# Instructions on how to run the application locally
## Setup the .env in the client folder (BackEnd)
DischargeEase/
├── config/
│   ├── database.js k
│   └── passport.js
├── controllers/
│   └── authController.js k
├── middleware/
│   ├── auth.js k
│   ├── rateLimiter.js
│   └── validator.js
├── models/
│   └── User.js
├── public/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── auth.js
│   └── images/
│       └── qr-placeholder.png
├── routes/
│   └── authRoutes.js
├── services/
│   └── singpassService.js k
├── utils/
│   ├── crypto.js k
│   ├── jwt.js k
│   └── sessionManager.js k
├── views/
│   └── auth/
│       ├── login.ejs k
│       └── qrcode.ejs not completed
├── .env.example
├── app.js  k
├── package.json  k
└── README.md


```bash
# Server Configuration
PORT=3000 # Assign the port for this backend server
NODE_ENV=development # Define the environment

# Database Configuration
DB_HOST=localhost # Or put your MySQL ip address/hostname, recommend to test the connection first
DB_PORT=3306 # Default MySQL port
DB_NAME=<Database Name> # Your application database storage
DB_USER=<Database Username> # Make sure this user have the required privileges
DB_PASSWORD=<Database Password>

# Additional Configuration
JWT_SECRET = "your_app_secret"
TOKEN_EXPIRES_IN = "30d"
EMAIL_SERVICE = 'gmail'
EMAIL_USER = 'iambornondec1982@gmail.com'
EMAIL_PASSWORD = 'iepc izih aylt snfy'
GOOGLE_CLIENT_ID = <Google OAuth2 Platform Client ID> # Specifically find the one that has .apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = <The Client Secret key for Google OAuth2>

# Allow the cors origin access below from client side
CORS_ORIGIN=http://localhost:3001,http://localhost:8080,http://127.0.0.1:3001,http://127.0.0.1:8080
```
## Dependancy for the server (BackEnd)
```bash
# TODO Update this dependencies
npm init -y
npm i express
npm i nodemon --save-dev
npm i cors
npm i dotenv
npm i sqlite3


npm i yup
npm i multer
npm i nodemailer uuid 
npm i bcrypt 
npm i jsonwebtoken  
npm i google-auth-library 
npm i jsonwebtoken
```

## To start the server (BackEnd)
cd into the server folder
```bash
npm start
node server.js
```