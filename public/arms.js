  function openExerciseModal(event) {
    event.preventDefault();
    document.getElementById("exercise-modal").style.display = "block";
  }
  
  async function saveExercise() {
    // Get input values
    const exerciseName = document.getElementById("exercise-name").value;
    const exerciseWeight = document.getElementById("exercise-weight").value;
    const exerciseReps = document.getElementById("exercise-reps").value;
    
    // Get selected exercise type
    const exerciseTypeRadioButtons = document.getElementsByName("exercise-type");
    let exerciseType = "";
    for (const radioButton of exerciseTypeRadioButtons) {
      if (radioButton.checked) {
        exerciseType = radioButton.value;
        break;
      }
    }
    const response = await fetch('/api/submit-list-exercise', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: exerciseName,
        weight: exerciseWeight,
        reps: exerciseReps,
        type: exerciseType,
      }),
    });
  
    const data = await response.json();
  
    if (response.status === 200) {
      // Exercise submitted successfully, add it to the DOM
      addExerciseToDOM({
        id: data.exercise._id,
        name: exerciseName,
        weight: exerciseWeight,
        reps: exerciseReps,
        type: exerciseType,
      });
  
      // Clear the input fields and close the modal
      document.getElementById('exercise-name').value = '';
      document.getElementById('exercise-weight').value = '';
      document.getElementById('exercise-reps').value = '';
      closeExerciseModal();
    } else {
      // Show an error message or handle the error
      console.error(data.message);
    }
  }
  
  function closeExerciseModal() {
    document.getElementById("exercise-modal").style.display = "none";
  }

  function addExerciseToDOM(exerciseData) {
    const exerciseList = document.querySelector('.exercise-list');
    console.log(`Adding exercise with id: ${exerciseData.id}`);
    // Check if the table exists, if not create it
    let exerciseTable = exerciseList.querySelector('table');
    if (!exerciseTable) {
      exerciseTable = document.createElement('table');
      exerciseList.appendChild(exerciseTable);
  
      // Create table header
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      ['Exercise Name', 'Weight (kg)', 'Reps', 'Type', 'Actions'].forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      exerciseTable.appendChild(thead);

      // Create table body
      const tbody = document.createElement('tbody');
      exerciseTable.appendChild(tbody);
    }
  
    // Add exercise data as a new row in the table
    const exerciseRow = document.createElement('tr');
    exerciseRow.dataset.id = exerciseData.id;
    exerciseRow.dataset.date = exerciseData.date;
    [exerciseData.name, exerciseData.weight, exerciseData.reps, exerciseData.type].forEach(data => {
    const td = document.createElement('td');
    td.textContent = data;
    exerciseRow.appendChild(td);
  });
  
    // Create delete button and add it to the row
    const deleteTd = document.createElement('td');
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'x';
    deleteButton.classList.add('delete-btn');

    deleteButton.addEventListener('click', async () => {
        await deleteExerciseList(exerciseRow.dataset.id, exerciseRow.dataset.date);
        exerciseRow.remove();
      });

    deleteTd.appendChild(deleteButton);
    exerciseRow.appendChild(deleteTd);
  
    const tbody = exerciseTable.querySelector('tbody');
    tbody.appendChild(exerciseRow);
  }

  async function fetchExercisesList(exerciseType) {
    const response = await fetch(`/api/get-exercises?type=${exerciseType}`);
    if (response.status === 200) {
      const exercises = await response.json();
      console.log(`Fetched exercises:`, exercises);
      exercises.forEach(exercise => {
        addExerciseToDOM({
          id: exercise._id,
          name: exercise.name,
          weight: exercise.weight,
          reps: exercise.reps,
          type: exercise.type, // Use the exercise type from the fetched data
        });
      });
    } else {
      console.error('Failed to fetch exercises');
    }
  }

  async function deleteExerciseList(id) {
    console.log(`Deleting exercise with id: ${id}`);
    const response = await fetch(`/api/delete-list-item/${id}`, {
      method: 'DELETE',
    });
  
    if (response.status === 200) {
      console.log('Exercise deleted successfully');
    } else {
      console.error('Failed to delete exercise');
    }
  }


  document.addEventListener("DOMContentLoaded", () => {
    
    const urlPath = window.location.pathname;
    const exerciseType = urlPath.split('/')[1];

    console.log(`Fetching exercises of type: ${exerciseType}`);

    // Event listener for the "Add +" button
    document.getElementById("add-exercise-btn").addEventListener("click", openExerciseModal);
  
    // Event listener for the "Save" button inside the exercise modal
    document.getElementById("save-exercise").addEventListener("click", saveExercise);
  
    // Event listener for the "Cancel" button inside the exercise modal
    document.getElementById("close-exercise-modal").addEventListener("click", closeExerciseModal);
  
    // Fetch exercises and render them on page load
    fetchExercisesList(exerciseType);
  });
