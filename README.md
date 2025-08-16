# CoinPilot

CoinPilot is an AI-driven personal finance advisor web application built with Next.js, Tailwind CSS, Shadcn UI, Clerk for authentication, Drizzle ORM with Neon for PostgreSQL database management, and Open AI's GPT-4 for financial advice. It allows users to track budgets, expenses, and income, visualize spending through charts, and receive personalized financial insights.

## Features

- **Dashboard**: Displays a summary of total budget, total spent, number of budgets, and income streams, with a bar chart for spending visualization.
- **Budget Management**: Create and manage budgets with customizable names, amounts, and emoji icons.
- **Expense Tracking**: Add and view expenses linked to specific budgets, with a list of recent expenses.
- **Income Tracking**: Record and aggregate income sources for financial overview.
- **AI-Powered Financial Advice**: Uses Open AI's GPT-4 to provide concise, data-driven financial advice based on user inputs.
- **Authentication**: Secure user login and signup with Clerk, supporting Google and other providers.
- **Responsive Design**: Built with Tailwind CSS and Shadcn UI for a polished, mobile-friendly interface.
- **Database Integration**: Uses Drizzle ORM with Neon PostgreSQL for efficient data storage and retrieval.
- **Visualizations**: Includes a bar chart (via `react-chart`) to visualize spending patterns.

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS, Shadcn UI, Lucide React (icons), Aceternity UI (mockup)
- **Backend**: Drizzle ORM, Neon (PostgreSQL)
- **Authentication**: Clerk
- **AI Integration**: Open AI API (GPT-4)
- **Charts**: React Chart
- **Others**: Framer Motion (animations), TypeScript/JavaScript


## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/coinpilot.git
   cd coinpilot
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```
   or
   ```bash
   yarn install
   ```

3. **Set Up Environment Variables**:
   Create a `.env.local` file in the root directory and add the following:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_DATABASE_URL=your_neon_database_url
   NEXT_PUBLIC_OPEN_AI_API_KEY=your_open_ai_api_key
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
   ```
   - Obtain `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` from the [Clerk Dashboard](https://dashboard.clerk.dev).
   - Get `NEXT_PUBLIC_DATABASE_URL` from the [Neon Console](https://console.neon.tech).
   - Acquire `NEXT_PUBLIC_OPEN_AI_API_KEY` from [Open AI](https://platform.openai.com).

4. **Set Up Database**:
   - Log in to [Neon Console](https://console.neon.tech) and create a new project (e.g., `coinpilot`).
   - Copy the database connection string and add it to `.env.local`.
   - Define the database schema in `utils/schema.jsx`:
     ```javascript
     import { pgTable, serial, varchar, integer, numeric } from "drizzle-orm/pg-core";

     export const budget = pgTable("budget", {
       id: serial("id").primaryKey(),
       name: varchar("name").notNull(),
       amount: numeric("amount").notNull(),
       icon: varchar("icon"),
       createdBy: varchar("createdBy").notNull(),
     });

     export const incomes = pgTable("incomes", {
       id: serial("id").primaryKey(),
       name: varchar("name").notNull(),
       amount: numeric("amount").notNull(),
       icon: varchar("icon"),
       createdBy: varchar("createdBy").notNull(),
     });

     export const expenses = pgTable("expenses", {
       id: serial("id").primaryKey(),
       name: varchar("name").notNull(),
       amount: numeric("amount").notNull(),
       createdBy: varchar("createdBy").notNull(),
       budgetId: integer("budgetId").references(() => budget.id),
       createdAt: varchar("createdAt"),
     });
     ```
   - Push the schema to Neon:
     ```bash
     npm run db:push
     ```

5. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   or
   ```bash
   yarn dev
   ```
   Open `http://localhost:3000` in your browser to view the app.

recharts.org) for data visualization.
- [Aceternity UI](https://ui.aceternity.com) for tablet mockup.
- [Lucide React](https://lucide.dev) for icons.
