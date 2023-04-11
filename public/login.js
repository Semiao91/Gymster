async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
        // Redirect to the main page if login is successful
        window.location.replace('/');
    } else {
        // Handle error if login failed
        alert('Login failed. Please check your email and password.');
    }
}

async function handleRegister(event) {
    event.preventDefault();

    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
    });

    if (response.ok) {
        // Redirect to the login page if registration is successful
        alert('Registration successful. You can now log in.');
        window.location.replace('/login');
    } else {
        // Handle error if registration failed
        alert('Registration failed.');
    }
}