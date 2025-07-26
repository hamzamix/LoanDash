# LoanDash - Personal Debt and Loan Tracker

## 1. About LoanDash

LoanDash is a modern, responsive web application designed to help you effortlessly manage your personal finances. It provides a clear and intuitive interface to track money you've borrowed (debts) and money you've lent to others (loans). With a comprehensive dashboard, detailed tracking, and insightful visualizations, LoanDash empowers you to stay on top of your financial obligations and assets, ensuring you never miss a due date.

The application is built with React, TypeScript, and Tailwind CSS, providing a fast, reliable, and visually appealing user experience. **The application uses a Node.js backend to store all data in a JSON file. This data is persisted using a Docker volume, ensuring your information is safe and secure on your server even if the container is restarted or updated.**

## 2. Key Features

- **Intuitive Dashboard:** Get a quick overview of your total debts and loans, with key metrics and charts for a comprehensive financial snapshot.
- **Detailed Debt & Loan Tracking:** Add, edit, and manage individual debts and loans with details like amount, due dates, descriptions, and interest rates for bank loans.
- **Payment Logging:** Easily log payments for your debts and repayments for your loans. Progress bars give you a visual indication of how close you are to paying off a debt or being repaid.
- **Interest Calculation:** For bank-type loans, the app automatically calculates and accrues monthly interest on the remaining balance.
- **Recurring Debts:** Set up recurring monthly debts (e.g., for subscriptions or regular borrowing) that automatically regenerate after being paid off.
- **Archive System:** Keep your main dashboard clean by archiving completed or defaulted items. Archived records can be reviewed or permanently deleted.
- **Dark Mode:** Switch between light and dark themes for comfortable viewing in any lighting condition.
- **Responsive Design:** A fully responsive layout ensures a seamless experience across desktops, tablets, and mobile devices.
- **Data Export:** Download all your debt and loan data to a CSV file for backup or external analysis.
- **Smart Notifications:** A visual indicator in the header alerts you to overdue items.
- **Search Functionality:** Quickly find specific debts, loans, or archived items across the application.
- **Settings Panel:** Customize application behavior, such as setting up auto-archiving rules for paid-off items.
- **Persistent Data:** All data is stored on a persistent Docker volume, ensuring your financial records are safe across container restarts and updates.

## 3. How to Deploy with Portainer

This application is containerized with Docker and includes a `docker-compose.yml` file, making it incredibly simple to deploy using Portainer Stacks.

### Prerequisites

- A running Docker environment.
- Portainer connected to your Docker environment.
- This project uploaded to your own GitHub repository (e.g., `github.com/hamzamix/loandsh`).

### Deployment Steps

1.  **Log in to Portainer:**
    Open your Portainer instance in your web browser and log in.

2.  **Navigate to Stacks:**
    In the left-hand menu, select the correct environment (e.g., your local Docker instance) and then click on **"Stacks"**.

3.  **Create a New Stack:**
    Click the **"+ Add stack"** button.

4.  **Configure the Stack:**
    -   **Name:** Give your stack a name, for example, `loandash`.
    -   **Build method:** Select **"Git Repository"**.
    -   **Repository URL:** Enter the URL of your GitHub repository (e.g., `https://github.com/hamzamix/loandsh.git`).
    -   **Repository reference:** Leave this as `refs/heads/main` to use the main branch.
    -   **Compose path:** Enter `docker-compose.yml`. Portainer will look for this file in the root of your repository.

5.  **Deploy the Stack:**
    Scroll down and click the **"Deploy the stack"** button. Portainer will now:
    a.  Pull the code from your GitHub repository.
    b.  Build the Docker image using the `Dockerfile` provided.
    c.  Create a persistent Docker volume named `loandash-data` to store your application data.
    d.  Create and start the container as defined in `docker-compose.yml`.

    > **Note:** If you've previously encountered errors like `all predefined address pools have been fully subnetted`, rest assured that the provided `docker-compose.yml` is configured to use Docker's default `bridge` network, which prevents this issue.

6.  **Access LoanDash:**
    Once the deployment is complete, you can access your LoanDash instance by navigating to `http://<your-server-ip>:8050` in your web browser (or `http://localhost:8050` if running on your local machine). The port `8050` is defined in the `docker-compose.yml` file.

That's it! Your personal instance of LoanDash is now up and running with persistent data storage.