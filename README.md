# MongoDB Dashboard

This project is a MongoDB Dashboard where users can pass their MongoDB URL and perform CRUD operations on the database using a Node.js server.

## Features

- Connect to any MongoDB database by providing the MongoDB URL.
- View all collections in the connected database.
- Execute queries on collections.
- Perform CRUD (Create, Read, Update, Delete) operations on the data.

## Getting Started

### Prerequisites

- Node.js installed on your machine.
- MongoDB URL for the database you want to connect to.

### Installation

1. Clone the repository:
    ```sh
    git clone <repository-url>
    cd mongodb-dashboard
    ```

2. Install the dependencies:
    ```sh
    npm install
    ```

### Running the Server

1. Start the Node.js server:
    ```sh
    node server.js
    ```

2. Open your browser and navigate to `http://localhost:3000`.

### Usage

1. Enter your MongoDB URL in the input field and click "Connect".
2. Browse through the collections in the connected database.
3. Select a collection to view and execute queries.
4. Perform CRUD operations on the data.

## Project Structure