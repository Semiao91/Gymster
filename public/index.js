function getCurrentDateTime() {
    const now = new Date();
    const options = { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric', 
        weekday: 'long', 
      };
      const dateTimeString = now.toLocaleString('en-US', options);
      return dateTimeString;
  }
  
const profileTripsDiv = document.querySelector('.profile-trips');
const dateTimeString = getCurrentDateTime();
const datetimeDiv = document.getElementById("dashboard-date");
const dateTitle = document.getElementById("tracker-title");
const deleteBtn = document.getElementById("delete-btn");

datetimeDiv.textContent = dateTimeString;

/////Handles select inputs for 5 exercises

const exerciseInput = document.getElementById("exercise-input");
const submitBtn = document.getElementById("submit-btn");
const trackerDisplayContent = document.getElementById("tracker-display-content");

//// Handles the submit for the specified exercise
submitBtn.addEventListener("click", () => {
  const selectedExercise = exerciseInput.options[exerciseInput.selectedIndex].value;
  const selectedDateElement = document.querySelector(".selected");
  const selectedDate = selectedDateElement ? parseInt(selectedDateElement.textContent) : null;

  if (selectedExercise && selectedDate) {
    const selectedDateString = new Date(currYear, currMonth, selectedDate).toISOString();
    submitExercise(selectedDateString, selectedExercise);
    trackerDisplayContent.textContent = `You did ${selectedExercise} on this day`;
  }
});

const daysTag = document.querySelector(".days");
const currentDate = document.querySelector(".current-date");
const prevNextIcon = document.querySelectorAll(".icons span");

let date = new Date();
let currYear = date.getFullYear();
let currMonth = date.getMonth();

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const renderCalendar = async () => {
  const exercises = await fetchExercises(currMonth, currYear);
  const exerciseDates = exercises ? exercises.map((exercise) => new Date(exercise.date).getDate()) : [];
  let firstDayofMonth = new Date(currYear, currMonth, 1).getDay();
  let lastDateofMonth = new Date(currYear, currMonth + 1, 0).getDate();
  let lastDayofMonth = new Date(currYear, currMonth, lastDateofMonth).getDay();
  let lastDateofLastMonth = new Date(currYear, currMonth, 0).getDate();
  let liTag = "";
  
  // Initialize checkmarkedDays variable
  let checkmarkedDays = 0;

  for (let i = firstDayofMonth; i > 0; i--) {
    liTag += `<li class="inactive">${lastDateofLastMonth - i + 1}</li>`;
  }

  for (let i = 1; i <= lastDateofMonth; i++) {
    let isToday = i === date.getDate() && currMonth === new Date().getMonth() && currYear === new Date().getFullYear() ? "active" : "";
    let hasExercise = exerciseDates.includes(i) ? "exercise-stored" : "";
    liTag += `<li class="${isToday} ${hasExercise}" onclick="selectDate(this)">${i}</li>`;

    // Increment checkmarkedDays if a checkmark is found
    if (hasExercise) {
      checkmarkedDays++;
    }
  }

  for (let i = lastDayofMonth; i < 6; i++) {
    liTag += `<li class="inactive">${i - lastDayofMonth + 1}</li>`;
  }

  currentDate.innerText = `${months[currMonth]} ${currYear}`;
  daysTag.innerHTML = liTag;

  // Update the profileTripsDiv element
  profileTripsDiv.textContent = checkmarkedDays;

  const progressPercentage = (checkmarkedDays / lastDateofMonth) * 100;
  const progressBar = document.querySelector('.visit .progress');
  progressBar.style.width = `${progressPercentage}%`;
}

renderCalendar();

prevNextIcon.forEach(icon => {
  icon.addEventListener("click", () => {
    currMonth = icon.id === "prev" ? currMonth - 1 : currMonth + 1;

    if(currMonth < 0 || currMonth > 11) {
      date = new Date(currYear, currMonth, new Date().getDate());
      currYear = date.getFullYear();
      currMonth = date.getMonth();
    } else {
      date = new Date();
    }

    renderCalendar();
  });
});



// Allows for day selection
async function selectDate(element) {
  const selected = document.querySelector(".selected");
  if (selected) {
    selected.classList.remove("selected");
  }
  dateTitle.textContent = `You selected ${element.textContent} of ${months[currMonth]}`;
  element.classList.add("selected");

  // Fetch exercise for the selected date
  const selectedDate = parseInt(element.textContent);
  const selectedDateString = new Date(currYear, currMonth, selectedDate).toISOString();
  const exercise = await fetchExercise(selectedDateString);

  // Update the tracker-display-content
  if (exercise) {
    trackerDisplayContent.textContent = `You did ${exercise.type} on this day`;
    deleteBtn.classList.remove('hidden'); // Show delete button
  } else {
    trackerDisplayContent.textContent = '';
    deleteBtn.classList.add('hidden'); // Hide delete button
  }
}

// Function that allows input storage
async function submitExercise(date, exercise) {
  const response = await fetch('/api/submit-exercise', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ date, exercise }),
  });

  if (response.ok) {
    const data = await response.json();
    console.log(data.message);
    updateUI(data.exercise);
  } else {
    console.error('Error submitting exercise.');
  }
}

function updateUI(exercise) {
  const selectedDay = document.querySelector('.selected');
  const trackerDisplayContent = document.getElementById('tracker-display-content');
  const deleteBtn = document.getElementById('delete-btn');

  if (selectedDay && exercise) {
    selectedDay.classList.add('exercise-stored');
    trackerDisplayContent.textContent = `You did ${exercise.type} on this day`;
    deleteBtn.classList.remove('hidden');
  } else {
    trackerDisplayContent.textContent = '';
    deleteBtn.classList.add('hidden');
  }
}

async function fetchExercise(date) {
  const response = await fetch(`/api/fetch-exercise?date=${date}`);

  if (response.ok) {
    const data = await response.json();
    return data.exercise;
  } else {
    console.error('Error fetching exercise.');
    return null;
  }
}

async function fetchExercises(month, year) {
  const response = await fetch(`/api/fetch-exercises?month=${month}&year=${year}`);

  if (response.ok) {
    const data = await response.json();
    return data.exercises;
  } else {
    console.error('Error fetching exercises.');
    return null;
  }
}

deleteBtn.addEventListener("click", async () => {
  const selectedDateElement = document.querySelector(".selected");
  const selectedDate = selectedDateElement ? parseInt(selectedDateElement.textContent) : null;

  if (selectedDate) {
    const selectedDateString = new Date(currYear, currMonth, selectedDate).toISOString();
    await deleteExercise(selectedDateString);
    await renderCalendar();
    trackerDisplayContent.textContent = '';
  }
});

async function deleteExercise(date) {
  const response = await fetch('/api/delete-exercise', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ date }),
  });

  if (response.ok) {
    const data = await response.json();
    console.log(data.message);
  } else {
    console.error('Error deleting exercise.');
  }
}

document.getElementById('logout-btn').addEventListener('click', logout);

async function logout() {
  try {
    const response = await fetch('/logout', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      // If the logout is successful, redirect the user to the login page
      window.location.href = '/login';
    } else {
      console.error('Logout failed:', response.statusText);
    }
  } catch (error) {
    console.error('Error logging out:', error);
  }
}

async function checkLoginStatus() {
  try {
    const response = await fetch('/api/check-login', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      // If the user is not logged in, redirect them to the login page
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Error checking login status:', error);
  }
}

checkLoginStatus();

/*
const colors = document.querySelectorAll(".colors div");

// Add draggable attribute to colors
colors.forEach(color => {
  color.setAttribute("draggable", "true");
});

// Add event listeners for dragstart on colors
colors.forEach(color => {
  color.addEventListener("dragstart", event => {
    event.dataTransfer.setData("text/plain", event.target.className);
  });
});

// Add event listeners for dragover on days
daysTag.addEventListener("dragover", event => {
  event.preventDefault();
});

// Add event listeners for drop on days
daysTag.addEventListener("drop", event => {
  event.preventDefault();
  const color = event.dataTransfer.getData("text/plain");
  if (color === "red" || color === "blue" || color === "yellow" || color === "green" || color === "purple") {
    event.target.style.backgroundColor = color;
  }
});
*/
