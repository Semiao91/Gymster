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

        window.location.replace('/');
    } else {
       
        alert('Login failed. Please check your email and password.');
    }
}

async function handleRegister(event) {
    event.preventDefault();

    const firstname = document.getElementById('register-firstname').value;
    const lastname = document.getElementById('register-lastname').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstname, lastname, email, password }),
    });

    if (response.ok) {
       
        alert('Registration successful. You can now log in.');
        window.location.replace('/login');
    } else {
  
        alert('Registration failed.');
    }
}
