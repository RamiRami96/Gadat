# Gadat

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.1.4.

## Features

- **Habit Tracking**: Create, edit, and delete habits
- **Authentication**: Simple login system (demo: admin/password)
- **Lazy Loading**: Routes are loaded on demand for better performance
- **Route Guards**: Protected routes and navigation guards
- **Responsive Design**: Works on desktop and mobile devices

## Guards Implementation

- **Auth Guard**: Protects routes that require authentication
- **Can Deactivate Guard**: Prevents navigation away from forms with unsaved changes
- **Habit Exists Guard**: Ensures habit exists before allowing edit operations

## Lazy Loading

All major features are lazy-loaded:
- Home page
- Authentication module
- Habits module (with create/edit forms)

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

**Demo Credentials:**
- Username: `admin`
- Password: `password`

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
