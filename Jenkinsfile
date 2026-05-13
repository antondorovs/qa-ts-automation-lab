pipeline {
    agent any

    stages {
        stage('Install dependencies') {
            steps {
                bat 'npm ci'
            }
        }

        stage('Run Playwright tests') {
            steps {
                bat 'npm test'
            }
        }
    }
}