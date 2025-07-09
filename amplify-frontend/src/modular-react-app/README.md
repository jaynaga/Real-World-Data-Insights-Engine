# Modular React App

This is a modular React application that features a simple login system, a dashboard for displaying datasets, and an upload page for adding new datasets. The application is styled using Tailwind CSS and utilizes React Router for navigation.

## Features

- **Login Page**: A simple form for user authentication with email and password inputs.
- **Dashboard Page**: Displays a welcome message and a list of mock datasets.
- **Upload Page**: A form for entering dataset details, including name, description, and file upload (without actual upload functionality).
- **Protected Routes**: Certain routes are protected and require authentication to access.

## Technologies Used

- React
- React Router
- Tailwind CSS
- Context API for state management

## Getting Started

### Prerequisites

- Node.js and npm installed on your machine.

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd modular-react-app
   ```

3. Install the dependencies:
   ```
   npm install
   ```

### Running the Application

To start the development server, run:
```
npm start
```

The application will be available at `http://localhost:3000`.

### Folder Structure

- `public/`: Contains the main HTML file.
- `src/`: Contains all the React components, pages, context, and styles.
- `tailwind.config.js`: Configuration file for Tailwind CSS.
- `package.json`: Contains project metadata and dependencies.

## Usage

- Navigate to the Login page to authenticate.
- Once logged in, you can access the Dashboard to view datasets.
- Use the Upload page to add new datasets.

## Contributing

Feel free to submit issues or pull requests for improvements or bug fixes. 

## License

This project is licensed under the MIT License.