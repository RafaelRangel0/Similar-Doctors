let doctors = [];

//DOM elements
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const filterButton = document.getElementById('filter-button');
const clearFiltersButton = document.getElementById('clear-filters-button');
const doctorsListElement = document.getElementById('doctors-list');
const doctorDetailsModal = document.getElementById('doctor-details-modal');
const modalCloseButton = document.querySelector('.close');

// Executes once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initial fetch of doctor data from the server
    fetchDoctors();

    // Attach event listeners to search and filter buttons to apply filters
    searchButton.addEventListener('click', function(event) {
        event.preventDefault(); 
        applyFilters(); 
    });

    filterButton.addEventListener('click', function(event) {
        event.preventDefault(); 
        applyFilters(); 
    });

    // Close modal event listener, streamlined with cached element
    modalCloseButton.onclick = closeModal;

    // Close modal if clicked outside the modal content, leveraging event delegation
    window.onclick = function(event) {
        if (event.target === doctorDetailsModal) {
            closeModal();
        }
    };

    // Clear filters and re-apply (refresh the list) upon clicking the clear filters button
    clearFiltersButton.addEventListener('click', function(event) {
        event.preventDefault();
        clearFilters(); 
        applyFilters();
    });
});

// Function to close the modal, improving code reuse
function closeModal() {
    doctorDetailsModal.style.display = 'none';
}


// Fetches doctor data from the server
function fetchDoctors() {
    fetch('/api/doctors')
        .then(response => response.json())
        .then(data => {
            doctors = data; // Update global doctors array with fetched data
            displayDoctors(doctors); // Display fetched doctors
            populateFilters(doctors); // Populate filter dropdowns based on fetched data
        })
        .catch(error => {
            console.error('Error loading doctors:', error);
            displayError('Failed to load doctors. Please try again later.');
        });
}

// Applies filters based on user input and displays filtered doctors
function applyFilters() {
    const searchValue = searchInput.value.toLowerCase();
    const specialtyFilter = document.getElementById('specialty-filter').value;
    const areaFilter = document.getElementById('area-filter').value;
    const minRating = parseFloat(document.getElementById('rating-filter').value) || 0; 

    // Filter doctors based on search criteria
    const filteredDoctors = doctors.filter(doctor => {
        const nameMatch = doctor.name.toLowerCase().includes(searchValue);
        const areaMatch = doctor.area === areaFilter || areaFilter === '';
        const specialtyMatch = doctor.specialty === specialtyFilter || specialtyFilter === '';
        const ratingMatch = doctor.reviewScore >= minRating;
        return nameMatch && areaMatch && specialtyMatch && ratingMatch;
    });

    displayDoctors(filteredDoctors); // Display filtered list of doctors
}

// Displays a list of doctors in the UI
function displayDoctors(doctors) {
    // Sort doctors alphabetically by last name
    doctors.sort((a, b) => {
        const lastNameA = a.name.split(" ").pop();
        const lastNameB = b.name.split(" ").pop();
        return lastNameA.localeCompare(lastNameB);
    });

    doctorsListElement.innerHTML = ''; // Clear the list before adding items
    
    // Create and append list items for each doctor
    doctors.forEach(doctor => {
        const listItem = document.createElement('li');
        listItem.classList.add('doctor-list-item');
        listItem.innerHTML = `
            <div>
                <strong>${doctor.name}</strong>, Specialty: ${doctor.specialty}, Rating: ${doctor.reviewScore}
            </div>
        `;

        // Add click event listener to each list item to show doctor details in a modal
        listItem.addEventListener('click', function() {
            showDoctorDetails(doctor.id);
        });

        doctorsListElement.appendChild(listItem);
    });
}

// Shows detailed information about a doctor in a modal
function showDoctorDetails(doctorId) {
    // Find the doctor by ID
    const doctor = doctors.find(doc => doc.id === doctorId);
    if (!doctor) return;

    // Update modal content with doctor details
    document.getElementById('modal-doctor-name').textContent = doctor.name;
    document.getElementById('modal-doctor-specialty').textContent = `Specialty: ${doctor.specialty}`;
    document.getElementById('modal-doctor-area').textContent = `Area: ${doctor.area}`;
    document.getElementById('modal-doctor-rating').textContent = `Rating: ${doctor.reviewScore}`;
    document.getElementById('modal-doctor-experience').textContent = `Years of Experience: ${doctor.yearsOfExperience}`;
    
    // Additional contact and education information
    const contactInfo = `Email: ${doctor.contact.email}, Phone: ${doctor.contact.phone}`;
    document.getElementById('modal-doctor-contact').textContent = contactInfo;

    const educationInfo = doctor.education.map(edu => `${edu.degree} from ${edu.institution}, ${edu.year}`).join("; ");
    document.getElementById('modal-doctor-education').textContent = `Education: ${educationInfo}`;

    // Display similar doctors in the modal
    displaySimilarDoctors(doctor);
    document.getElementById('doctor-details-modal').style.display = 'block';
}

// Displays similar doctors in the modal 
// Doctors of the same Specialty and Area are most similar, with doctors of the rating closest to the selected doctor being most similar.
// Doctors of the same specialty but not area are next, (also priotized by closest rating)
function displaySimilarDoctors(doctor) {
    let similarDoctors = doctors.filter(doc => doc.specialty === doctor.specialty && doc.id !== doctor.id);

    similarDoctors.sort((a, b) => {
        // Calculate the absolute difference in rating from the selected doctor
        const diffA = Math.abs(a.reviewScore - doctor.reviewScore);
        const diffB = Math.abs(b.reviewScore - doctor.reviewScore);

        if (a.area === doctor.area && b.area !== doctor.area) {
            return -1; 
        } else if (a.area !== doctor.area && b.area === doctor.area) {
            return 1; 
        } else {
    
            return diffA - diffB;
        }
    });

    // Limit to top 10 similar doctors
    similarDoctors = similarDoctors.slice(0, 10);

    // Display similar doctors
    const similarDoctorsList = document.getElementById('similar-doctors-list');
    similarDoctorsList.innerHTML = '';
    similarDoctors.forEach(similarDoctor => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `<a href="#" onclick="showDoctorDetails(${similarDoctor.id}); return false;">${similarDoctor.name} - ${similarDoctor.area}, Rating: ${similarDoctor.reviewScore}</a>`;
        similarDoctorsList.appendChild(listItem);
    });
}

// Displays an error message in the UI

function displayError(message) {
    const listElement = document.getElementById('doctors-list');
    listElement.innerHTML = ''; 
    const errorMessage = document.createElement('li');
    errorMessage.textContent = message;
    listElement.appendChild(errorMessage);
}

// Populates filter dropdowns based on available doctor data
function populateFilters(doctors) {
    const specialtySet = new Set();
    const areaSet = new Set();

    // Extract unique specialties and areas
    doctors.forEach(doctor => {
        if (doctor.specialty) specialtySet.add(doctor.specialty);
        if (doctor.area) areaSet.add(doctor.area);
    });

    // Populate the specialty filter dropdown
    const specialtySelect = document.getElementById('specialty-filter');
    specialtySet.forEach(specialty => {
        const option = new Option(specialty, specialty);
        specialtySelect.appendChild(option);
    });

    // Populate the area filter dropdown
    const areaSelect = document.getElementById('area-filter');
    areaSet.forEach(area => {
        const option = new Option(area, area);
        areaSelect.appendChild(option);
    });
}

function clearFilters() {
    // Reset the value of the search input and select elements
    document.getElementById('search-input').value = '';
    document.getElementById('specialty-filter').value = '';
    document.getElementById('area-filter').value = '';
    document.getElementById('rating-filter').value = '';

   
    fetchDoctors(); 
}

