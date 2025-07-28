# LoanDash - Personal Debt and Loan Tracker 

<p align="center">
  <img src="https://raw.githubusercontent.com/hamzamix/LoanDash/refs/heads/main/screenshots/logo.png" alt="LoanDash Logo">
</p>

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

## 3. Screenshots 

Here's a preview of the LoanDash application:

![LoanDash Home Page - Dark Mode](https://raw.githubusercontent.com/hamzamix/LoanDash/refs/heads/main/screenshots/homedark.png)

* [More Screenshots](https://github.com/hamzamix/LoanDash/tree/main/screenshots)

## 4. Getting Started

Follow these simple steps to get your LoanDash application up and running.

### Prerequisites

Before you begin, ensure you have the following installed on your system:

* **Git:** For cloning the repository.
* **Docker Desktop (Windows/macOS) or Docker Engine & Docker Compose (Linux):** To run the application in containers.
    * [Install Docker Desktop](https://www.docker.com/products/docker-desktop)
    * [Install Docker Engine (Linux)](https://docs.docker.com/engine/install/)
    * [Install Docker Compose (Linux)](https://docs.docker.com/compose/install/)

### Installation & Deployment

This method uses the pre-built Docker image from Docker Hub, providing the quickest way to get started.

1.  **Clone the Repository:**
    Navigate to where you want to store the project on your machine, then run:
    ```bash
    git clone [https://github.com/hamzamix/LoanDash.git](https://github.com/hamzamix/LoanDash.git)
    cd LoanDash
    ```
    
2.  **Alternatively:**
    you can manually download just the [docker-compose.yml](https://github.com/hamzamix/LoanDash/blob/main/docker-compose.yml) file if you prefer

    
3.  **Start the Application:**
    From inside the `LoanDash` directory (where `docker-compose.yml` is located), execute:
    ```bash
    sudo docker-compose up -d
    ```
    * Docker Compose will automatically pull the `hamzamix/loandash:latest` image from Docker Hub (if it's not already on your system).
    * It will then create and start the `loandash` container, mapping port `8050` on your host to the application's internal port `3000`.
    * A Docker volume named `loandash-data` will be created (if it doesn't exist) to ensure your `db.json` data persists across container restarts and updates.

4.  **Access the Application:**
    Open your web browser and navigate to:
    ```
    http://localhost:8050
    ```
    Your LoanDash application should now be running!

### Updating the Application

When a new version of LoanDash is pushed to Docker Hub, you can easily update your running instance:

1.  **Navigate to your project directory:**
    ```bash
    cd /path/to/your/LoanDash
    ```
2.  **Pull the latest Docker image and recreate containers:**
    ```bash
    sudo docker-compose pull loandash # Fetches the new 'latest' image for the loandash service
    sudo docker-compose up -d --force-recreate # Stops, removes, and recreates the container with the new image
    ```
    This process ensures your `loandash-data` volume remains intact, preserving your `db.json` data.

That's it! Your personal instance of LoanDash is now up and running with persistent data storage.


[What Next](https://github.com/hamzamix/LoanDash/blob/main/WHAT-NEXT.md)

---

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.
