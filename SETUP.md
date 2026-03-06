# HR Suite Local Setup Guide

Follow these steps to set up the project on a new system with a local PostgreSQL database.

## 1. Prerequisites
- **Node.js**: Install from [nodejs.org](https://nodejs.org/)
- **PostgreSQL**: Install and ensure it's running.

## 2. Database Setup
1. Create a database named `website` in your PostgreSQL instance.
2. Go to the `server` directory:
   ```bash
   cd server
   ```
3. Copy `.env.example` to a new file named `.env`:
   ```bash
   copy .env.example .env
   ```
4. Update `DATABASE_URL` in the `.env` file with your credentials:
   `DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/website`
   `PORT=5001`

## 3. Run Automated Migration
This command will automatically create all tables and a default HR user:
```bash
npm run db:setup
```

## 4. Start the Application
- **Backend**: In the `server` folder, run `npm start`.
- **Frontend**: In the root folder, run `npm run dev`.

---
**Default HR Account:**
- **Email**: hr@indusinnovate.com
- **Password**: Admin@1234

**Default Employee Account:**
- **Email**: employee@indusinnovate.com
- **Password**: Employee@1234
