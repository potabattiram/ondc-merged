const admin = require('firebase-admin');

/**
 * initialize firebase 
 */
const initializeFirebase = () => {
    admin.initializeApp({
        credential: admin.credential.cert({
            "type": "service_account",
            "project_id": "ondc-test-4f0d7",
            "private_key_id": "92ed40d120ad4ded6b84a5436d8c5c8df0eb2033",
            "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCLhswUYKOoxtlV\n78tvIKPSIGzzPXOr9PsQgR7IOuiffSvEdL6ghcfMul5+vwJOICI5E6jBQT4WK1nF\nPehyx/xe/khpIWw1bJHS6BdJcL6r0lsKpaoCvclmj+FP3zghPu6qEURkgU9VAU9I\n7VW9LPbNhDDOZVdtB7mqpcctLFnjLdKICQgh5gaaUPpRvTXSciV/EA7iri3jl8YZ\nBxbcmgnT7M4mrFj5UTxFrLcqJP3grb/hOakxaUppA3eB0WMfs/lRoJ8aZEKbBVVX\nJzYAu3xMppq6vkPyCS7AvTX07sxz7zTaIqKwEpq75lrrINusOU2phmg1iepAyJwQ\nOd/fjtoTAgMBAAECggEACUFahacfCntdf/OL2v+SYZMDqlaMtwuyOpcke7BaRve0\n8NXnrg4OjpH14h8S7MWTHGMljuNtIwGI9Z1uLzljdpYUJ1+JGVNUdv+TSXlaBI7L\n7Qn6zy5X6Kt2c2ebH98LUnezwdD8E+dZPL0VmQED3BnyA0O6R867FH4YfYwgG4KR\nDb5REtyEUkbBSi14zE6wTajNmmHYiIAjlraL4IW6jJ2Sw0BGkRujW2RsGvjyy8TN\noGqxCWx60Ih8g670ch9rS9TCGnMt98NlUvCtCmiMmPUHJBYtXSPizMgRKIKXUD3B\nOchMqPLXbUOfkpn16Adi9No5S317ZmcNSXI7tZq4CQKBgQC/W8ooUlsADZNrLPy2\nVIt4XObdpzNljyHcrEf9CxYsjO5Q2fn6YkNstga0zH8a444pMBctAZ3W7TFEA1qY\nGnFmOdtodyL5pNpdWriajjuhZAY9oUja+ysFveV9QG8IMLtQRrtnvLvsSxOe5xMY\nMIxw6d98mpXBJR0hBJHSvHfiyQKBgQC6qLSNpBK54Q5y0SJtwZe1QczypeFASUGJ\nyf3/r6eXxS6W+RMkvwa3ig4vxKHs6QT1zKJI4KA7SXRzNi6Q9w17F+iSuBKXpOBV\n/clV8xkFKmzm/pxlbhl7EPvAj9zNEHGh0DJja7u1qPIPaoz9INqi2TjT/B5uKnoW\nNROTcFAH+wKBgQCuV3WGaQoJsVS3V8RiZgKvxYx9M4FrLQ2/3KK106z/J+NUfFP5\nIB+n4uuXO50uJVZ3Bh6HXaqtj2rMOXYHkEfyyBGzSp/t7JkaZrY78gw4DUZ2TgRv\nplhbIdj81YCTaLqv99F0QQrBzODybDsEVe8OTLXV840u7J5uX5hv9FARqQKBgFrN\n+5f0O4/lpmvAxajzRuRMsHFStTPa72EivMgIIdW5fSLA5Mk5jQD4zlH6rHNeIKWa\n+U/OxuRQpa/uqdSn+wzo4qGNnq3a7a+nmKyRaJiUvQnazyag2xB9gJt64QV5fG4l\npH2tSVHkcG2DfjceJn6WggjOW9doHqBzDaTqPGTFAoGBAJqnbqOT5GQ2pwYah6+V\nIR8G7CeapAHMkCoSeGwf4+VFiU/HJ2o49y0q1RwQB0ONMC2Hu7QsC4DpBhsozMu6\nkiKT/GaFjAk86FjPrtbvFlEq5qFQIv23RDnb7x0VWpc2jxcOBcQXGQglvIM6AYXZ\ngR7Mq2Fm23S6ZRbJ6zFVZqst\n-----END PRIVATE KEY-----\n",
            "client_email": "firebase-adminsdk-6o626@ondc-test-4f0d7.iam.gserviceaccount.com",
            "client_id": "117207986222092896236",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-6o626%40ondc-test-4f0d7.iam.gserviceaccount.com",
            "universe_domain": "googleapis.com"
          }
          )
    });
}

module.exports = initializeFirebase;