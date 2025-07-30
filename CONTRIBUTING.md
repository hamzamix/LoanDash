# Contributing to LoanDash

Thank you for your interest in contributing to LoanDash! We appreciate any help, whether it's reporting bugs, suggesting features, improving documentation, or writing code.

By contributing to LoanDash, you agree to abide by its [Code of Conduct](CODE_OF_CONDUCT.md).

## How Can I Contribute?

### Reporting Bugs

* **Check existing issues:** Before opening a new issue, please check if the bug has already been reported.
* **Provide detailed information:** When reporting a bug, include:
    * Steps to reproduce the bug.
    * Expected behavior.
    * Actual behavior.
    * Screenshots or videos (if applicable).
    * Your operating system, browser, and Docker versions.
    * Any relevant error messages from the browser console or Docker logs.
* **Open a new issue:** If the bug hasn't been reported, open a new issue on the [LoanDash GitHub Issues page](https://github.com/hamzamix/LoanDash/issues).

### Suggesting Enhancements / Features

* **Check existing issues:** See if your idea has already been discussed.
* **Describe your idea:** Clearly explain the feature or enhancement, why you think it would be valuable, and how it might work.
* **Open a new issue:** Create a new issue on the [LoanDash GitHub Issues page](https://github.com/hamzamix/LoanDash/issues) with the label `enhancement` or `feature`.

### Contributing Code

We welcome code contributions! Here's a general workflow:

1.  **Fork the repository:** Click the "Fork" button at the top right of the [LoanDash GitHub repository](https://github.com/hamzamix/LoanDash).
2.  **Clone your forked repository:**
    ```bash
    git clone [https://github.com/](https://github.com/)[YOUR-USERNAME]/LoanDash.git
    cd LoanDash
    ```
3.  **Create a new branch:** Choose a descriptive name for your branch (e.g., `bugfix/fix-dashboard-chart` or `feature/add-export-csv`).
    ```bash
    git checkout -b your-branch-name
    ```
4.  **Set up your local development environment:**
    * Ensure you have Node.js (v18 or higher recommended) and npm/yarn installed.
    * Install dependencies: `npm install` or `yarn install`
    * Start the development server: `npm run dev` or `yarn dev`
    * The backend can be run using Docker Compose as described in the `README.md` (for the `server.js` part). Make sure your local `.env` (if used) or `server.js` is configured to connect to the backend's default port.
5.  **Make your changes:** Implement your bug fix or feature.
6.  **Test your changes:** Ensure your changes work as expected and don't introduce new issues. Run any existing tests, and add new ones if applicable.
7.  **Commit your changes:** Write clear, concise commit messages.
    ```bash
    git commit -m "feat: Add new feature X"
    # or
    git commit -m "fix: Resolve bug Y"
    ```
8.  **Push your branch to your forked repository:**
    ```bash
    git push origin your-branch-name
    ```
9.  **Open a Pull Request (PR):**
    * Go to your forked repository on GitHub.
    * Click on "Compare & pull request" (or navigate to the Pull Requests tab).
    * Provide a clear title and description for your PR, explaining what it does, why it's needed, and referencing any related issues.
    * Ensure your PR targets the `main` branch of the original `hamzamix/LoanDash` repository.

### Coding Style

* Follow the existing coding style of the project.
* Ensure your code is well-commented where necessary.
* Keep changes focused on one bug fix or one feature per PR.

### License

By contributing, you agree that your contributions will be licensed under the project's [Apache License 2.0](LICENSE).

---
