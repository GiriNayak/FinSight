echo '# FinSight: Personal Finance Assistant 💰

FinSight is a full-stack web application designed to help users efficiently manage and visualize their financial transactions. With a clean and intuitive interface, it transforms raw financial data into actionable insights, enabling smarter financial decisions.

### Key Features

* **Comprehensive Financial Dashboard:** View total income, total expenses, and current balance at a glance through beautifully designed summary cards, displaying numbers in an easy-to-read format (e.g., ₹9.09 K).

* **Dynamic Data Visualizations:** Real-time interactive charts allow users to track spending habits. Includes:
  - **Expenses by Category:** Identify where money is going across different categories.
  - **Income Over Time:** Observe trends in income inflows.
  - **Expenses Over Time:** Monitor spending patterns over selected periods.

* **Advanced Date Filtering:** Filter transactions by any custom date range. The transaction history and all charts update instantly to reflect the selected period, making historical financial analysis effortless.

* **Paginated Transaction History:** Display transactions in a paginated format with a fixed number per page (default 10), ensuring fast performance even as data grows. Navigation via Next/Previous buttons is seamless and intuitive.

* **Transaction Management:** Add, edit, or delete transactions with immediate updates to the dashboard and visualizations. Supports both income and expense entries with categories, amounts, descriptions, and dates.

### Technology Stack 🛠️

* **Backend:** Node.js, Express.js
* **Database:** SQLite3 – a lightweight, file-based database ideal for single-user or small-scale applications
* **Frontend:** HTML5, CSS3, Vanilla JavaScript
* **Libraries & Tools:** Chart.js for charts, Multer for file uploads, PDF-Parse for PDF processing (receipt uploads)

### Design & Implementation

FinSight is built with a modular, maintainable architecture. Key design highlights:

* **Separation of Concerns:** Frontend logic, API handling, and database operations are decoupled for clean maintainability.
* **Responsive UI:** All components adapt to different screen sizes for optimal user experience.
* **Robust Error Handling:** Backend APIs include comprehensive error handling, ensuring application reliability.
* **Scalability Consideration:** Pagination and efficient data fetching ensure smooth performance as transaction data grows.

### Usage Guide

1. **Launch the Application:**
   - Install dependencies: `npm install express sqlite3 multer pdf-parse`
   - Start the server: `node server.js`

2. **Add Transactions:**
   - Enter type (income/expense), amount, category, description, and date.
   - Transactions are immediately reflected in the history and visualizations.

3. **Filter Transactions:**
   - Use the date range filters to view transactions for a specific period.
   - Dashboard and charts dynamically update to reflect the selected range.

4. **Navigate Transaction History:**
   - Use Next/Previous buttons to browse paginated transactions (10 per page).
   - Efficiently manage large datasets without performance lag.

5. **Visual Insights:**
   - Charts display trends and patterns in spending and income.
   - Helps users identify areas for budget optimization and financial planning.

### Summary

FinSight combines robust backend functionality with an intuitive frontend interface, offering a powerful tool for financial tracking and analysis. Its features, dynamic visualizations, and clean codebase make it an ideal showcase of practical full-stack development skills.

' > README.md
