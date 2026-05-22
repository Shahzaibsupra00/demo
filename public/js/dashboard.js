/**
 * DASHBOARD.JS - Student Directory Console Controller
 * Rich Vanilla JS API integration, pagination, Sorting, Filtering, and Modals
 */

document.addEventListener("DOMContentLoaded", () => {
  initDashboard();
});

// App Dashboard Core States
let students = [];
let filteredStudents = [];
let currentPage = 1;
const itemsPerPage = 8;
let currentViewMode = "table"; // 'table' or 'card'

let searchQuery = "";
let selectedDept = "All";
let selectedGender = "All";
let sortBy = "alphabetical-asc";

let deleteTargetId = null;

async function initDashboard() {
  const spinner = document.getElementById("global-spinner");
  if (spinner) spinner.classList.add("active");

  try {
    await fetchStudents();
    setupEventListeners();
    applyFiltersAndSort();
  } catch (err) {
    console.error("Dashboard initialization crash:", err);
    if (window.showToast) window.showToast("Failed loading students roster.", "error");
  } finally {
    if (spinner) spinner.classList.remove("active");
  }
}

// REST API Database fetching
async function fetchStudents() {
  const response = await fetch("/api/students");
  if (!response.ok) {
    throw new Error(`API returned status code ${response.status}`);
  }
  students = await response.json();
}

// Attach listeners to control elements
function setupEventListeners() {
  // 1. Search Bar listener
  const searchInput = document.getElementById("search-bar");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      currentPage = 1;
      applyFiltersAndSort();
    });
  }

  // 2. Department Dropdown listener
  const deptSelect = document.getElementById("dept-filter-select");
  if (deptSelect) {
    deptSelect.addEventListener("change", (e) => {
      selectedDept = e.target.value;
      currentPage = 1;
      applyFiltersAndSort();
    });
  }

  // 3. Sorting Dropdown listener
  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      sortBy = e.target.value;
      applyFiltersAndSort();
    });
  }

  // 4. Gender Pills listeners
  const genderPills = document.querySelectorAll("#gender-pill-container .gender-btn-pill");
  genderPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      genderPills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      
      selectedGender = pill.getAttribute("data-gender");
      currentPage = 1;
      applyFiltersAndSort();
    });
  });

  // 5. Layout switches (Table vs Cards Grid)
  const btnTable = document.getElementById("btn-table-view");
  const btnCard = document.getElementById("btn-card-view");
  const tableView = document.getElementById("student-table-view-container");
  const cardView = document.getElementById("student-card-view-container");

  if (btnTable && btnCard && tableView && cardView) {
    btnTable.addEventListener("click", () => {
      btnTable.classList.add("active");
      btnCard.classList.remove("active");
      tableView.style.display = "block";
      cardView.style.display = "none";
      currentViewMode = "table";
      renderView();
    });

    btnCard.addEventListener("click", () => {
      btnCard.classList.add("active");
      btnTable.classList.remove("active");
      tableView.style.display = "none";
      cardView.style.display = "grid";
      currentViewMode = "card";
      renderView();
    });
  }

  // 6. Reset Empty state button helper
  const btnReset = document.getElementById("btn-reset-filters");
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (deptSelect) deptSelect.value = "All";
      if (sortSelect) sortSelect.value = "alphabetical-asc";
      
      genderPills.forEach((p) => p.classList.remove("active"));
      if (genderPills[0]) genderPills[0].classList.add("active");

      searchQuery = "";
      selectedDept = "All";
      selectedGender = "All";
      sortBy = "alphabetical-asc";
      currentPage = 1;

      applyFiltersAndSort();
      if (window.showToast) window.showToast("Roster criteria reset successfully.", "info");
    });
  }

  // 7. Modals Delete operations wire-up
  const delOverlay = document.getElementById("delete-confirm-modal");
  const delCloseX = document.getElementById("modal-delete-close");
  const delCancelBtn = document.getElementById("btn-delete-cancel");
  const delConfirmBtn = document.getElementById("btn-delete-confirm");

  const closeDeleteModal = () => {
    if (delOverlay) delOverlay.classList.remove("open");
    deleteTargetId = null;
  };

  if (delCloseX) delCloseX.addEventListener("click", closeDeleteModal);
  if (delCancelBtn) delCancelBtn.addEventListener("click", closeDeleteModal);
  if (delOverlay) {
    delOverlay.addEventListener("click", (e) => {
      if (e.target === delOverlay) closeDeleteModal();
    });
  }

  if (delConfirmBtn) {
    delConfirmBtn.addEventListener("click", async () => {
      if (!deleteTargetId) return;
      
      const spinner = document.getElementById("global-spinner");
      if (spinner) spinner.classList.add("active");
      closeDeleteModal();

      try {
        const res = await fetch(`/api/students/${deleteTargetId}`, {
          method: "DELETE"
        });
        const statusData = await res.json();
        
        if (res.ok && statusData.success) {
          if (window.showToast) window.showToast(`${statusData.student.fullName}'s academic archives have been destroyed.`, "success");
          await fetchStudents(); // Refresh memory lists
          applyFiltersAndSort();
        } else {
          throw new Error(statusData.error || "System failed processing delete command.");
        }
      } catch (err) {
        console.error("Delete command failure:", err);
        if (window.showToast) window.showToast("Record destruction failed.", "error");
      } finally {
        if (spinner) spinner.classList.remove("active");
      }
    });
  }

  // 8. Pagination controls
  const prevBtn = document.getElementById("prev-page-btn");
  const nextBtn = document.getElementById("next-page-btn");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderView();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        renderView();
      }
    });
  }
}

// Compute live metrics and multi-filter criteria
function applyFiltersAndSort() {
  // 1. Evaluate Metrics counters based on global raw database
  calcSystemMetrics();

  // 2. Multi-Filter math
  filteredStudents = students.filter((student) => {
    const matchesSearch = 
      student.fullName.toLowerCase().includes(searchQuery) ||
      student.email.toLowerCase().includes(searchQuery) ||
      student.university.toLowerCase().includes(searchQuery) ||
      student.studentId.toLowerCase().includes(searchQuery);

    const matchesDept = selectedDept === "All" || student.department === selectedDept;
    const matchesGender = selectedGender === "All" || student.gender.toLowerCase() === selectedGender.toLowerCase();

    return matchesSearch && matchesDept && matchesGender;
  });

  // 3. Sorting logic
  filteredStudents.sort((a, b) => {
    if (sortBy === "alphabetical-asc") {
      return a.fullName.localeCompare(b.fullName);
    } else if (sortBy === "alphabetical-desc") {
      return b.fullName.localeCompare(a.fullName);
    } else if (sortBy === "age-asc") {
      return a.age - b.age;
    } else if (sortBy === "age-desc") {
      return b.age - a.age;
    } else if (sortBy === "univesity-asc") {
      return a.university.localeCompare(b.university);
    }
    return 0;
  });

  renderView();
}

// Update primary stats counter blocks
function calcSystemMetrics() {
  const totEl = document.getElementById("metric-total");
  const csEl = document.getElementById("metric-cs");
  const ageEl = document.getElementById("metric-age");
  const gradEl = document.getElementById("metric-graduated");

  if (!totEl || !csEl || !ageEl || !gradEl) return;

  if (students.length === 0) {
    totEl.textContent = "0";
    csEl.textContent = "0";
    ageEl.textContent = "0";
    gradEl.textContent = "0%";
    return;
  }

  const total = students.length;
  const csMajors = students.filter((s) => s.department && s.department.includes("Computer Science")).length;
  const rawSumAge = students.reduce((sum, s) => sum + s.age, 0);
  const avgAge = (rawSumAge / total).toFixed(1);
  const graduatedCount = students.filter((s) => s.status === "Graduated").length;
  const activeCount = students.filter((s) => s.status === "Active").length;
  const gradRatio = Math.round((graduatedCount / (graduatedCount + activeCount || 1)) * 100);

  totEl.textContent = total.toString();
  csEl.textContent = csMajors.toString();
  ageEl.textContent = `${avgAge} yrs`;
  gradEl.textContent = `${gradRatio}%`;
}

// Slice datasets and compile HTML representations
function renderView() {
  const emptyState = document.getElementById("empty-state-card");
  const tableViewContainer = document.getElementById("student-table-view-container");
  const cardViewContainer = document.getElementById("student-card-view-container");

  if (filteredStudents.length === 0) {
    if (emptyState) emptyState.style.display = "block";
    if (tableViewContainer) tableViewContainer.style.display = "none";
    if (cardViewContainer) cardViewContainer.style.display = "none";
    
    // Hide paginator bar
    const pagBar = document.getElementById("dashboard-pagination");
    if (pagBar) pagBar.style.display = "none";
    return;
  }

  if (emptyState) emptyState.style.display = "none";
  
  if (currentViewMode === "table") {
    if (tableViewContainer) tableViewContainer.style.display = "block";
    if (cardViewContainer) cardViewContainer.style.display = "none";
  } else {
    if (tableViewContainer) tableViewContainer.style.display = "none";
    if (cardViewContainer) cardViewContainer.style.display = "grid";
  }

  // Show normal pagination
  const pagBar = document.getElementById("dashboard-pagination");
  if (pagBar) pagBar.style.display = "flex";

  // Calculate items pagination bounds
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  if (currentPage > totalPages) currentPage = totalPages;

  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = Math.min(startIdx + itemsPerPage, filteredStudents.length);
  const pageStudents = filteredStudents.slice(startIdx, endIdx);

  // Update Page numbers indicator text label
  const infoEl = document.getElementById("pagination-info");
  if (infoEl) {
    infoEl.textContent = `Displaying profiles ${startIdx + 1} - ${endIdx} of ${filteredStudents.length} entries matching criteria`;
  }

  // Compile view modes HTML
  if (currentViewMode === "table") {
    renderTable(pageStudents);
  } else {
    renderCards(pageStudents);
  }

  // Compile numbers list
  renderPaginationNumbers(totalPages);
}

// Renders alternate row HTML table code
function renderTable(list) {
  const tbody = document.getElementById("student-table-tbody");
  if (!tbody) return;

  let htmlStr = "";
  list.forEach((student) => {
    const statusClass = 
      student.status === "Active" ? "badge-active" : 
      student.status === "Suspended" ? "badge-suspended" : "badge-graduated";

    htmlStr += `
      <tr class="smooth-all">
        <td>
          <div class="table-student-cell">
            <img class="student-avatar" src="${student.image}" alt="${student.firstName}" onerror="this.src='https://robohash.org/${student.firstName}?set=set5'" referrerpolicy="no-referrer"/>
            <div class="student-info-mini">
              <h4>${student.fullName}</h4>
              <p>${student.email}</p>
            </div>
          </div>
        </td>
        <td class="table-id-cell">${student.studentId}</td>
        <td style="font-weight: 500;">${student.department}</td>
        <td>${student.age}</td>
        <td><span style="text-transform: capitalize;">${student.gender}</span></td>
        <td><span class="badge ${statusClass}">${student.status}</span></td>
        <td style="font-size: 0.85rem; color: var(--text-muted);">${student.enrollmentDate}</td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 4px;">
            <a href="/student-details?id=${student.id}" class="btn btn-secondary btn-sm" style="padding: 0.25rem 0.5rem; font-size: 0.775rem;">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              View
            </a>
            <button class="btn btn-danger btn-sm del-trigger-btn" data-id="${student.id}" data-name="${student.fullName}" style="padding: 0.25rem 0.5rem; font-size: 0.775rem;">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              Trash
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = htmlStr;

  // Add event triggers to delete buttons
  tbody.querySelectorAll(".del-trigger-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const name = btn.getAttribute("data-name");
      triggerDeletePortal(id, name);
    });
  });
}

// Card grid block compilation
function renderCards(list) {
  const grid = document.getElementById("student-card-view-container");
  if (!grid) return;

  let htmlStr = "";
  list.forEach((student) => {
    const statusClass = 
      student.status === "Active" ? "badge-active" : 
      student.status === "Suspended" ? "badge-suspended" : "badge-graduated";

    htmlStr += `
      <article class="student-dashboard-card smooth-all">
        <div class="card-header-actions">
          <div class="card-student-summary">
            <img class="student-avatar" style="width: 50px; height: 50px;" src="${student.image}" alt="${student.firstName}" onerror="this.src='https://robohash.org/${student.firstName}?set=set5'" referrerpolicy="no-referrer"/>
            <div>
              <h3>${student.fullName}</h3>
              <p>${student.studentId}</p>
            </div>
          </div>
          <span class="badge ${statusClass}" style="margin-top: 4px;">${student.status}</span>
        </div>

        <div class="card-body-details">
          <div class="card-detail-item">
            <strong>Department:</strong>
            <span>${student.department}</span>
          </div>
          <div class="card-detail-item">
            <strong>Gender / Age:</strong>
            <span style="text-transform: capitalize;">${student.gender}, ${student.age} yrs</span>
          </div>
          <div class="card-detail-item">
            <strong>Campus Site:</strong>
            <span style="max-width: 150px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${student.university}">${student.university}</span>
          </div>
        </div>

        <div class="card-footer-controls">
          <a href="/student-details?id=${student.id}" class="btn btn-secondary btn-sm" style="flex: 1; gap: 4px; font-size: 0.8rem;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            Profile Card
          </a>
          <button class="btn btn-danger btn-sm card-del-trigger" data-id="${student.id}" data-name="${student.fullName}" style="padding: 0.375rem 0.625rem;" title="Delete Record">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </article>
    `;
  });

  grid.innerHTML = htmlStr;

  // Add event triggers to card delete click
  grid.querySelectorAll(".card-del-trigger").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const name = btn.getAttribute("data-name");
      triggerDeletePortal(id, name);
    });
  });
}

// Modal portal showing validation UI
function triggerDeletePortal(id, name) {
  deleteTargetId = id;
  const modal = document.getElementById("delete-confirm-modal");
  const nameLabel = document.getElementById("delete-candidate-name");

  if (modal && nameLabel) {
    nameLabel.textContent = name;
    modal.classList.add("open");
  }
}

// Render paginator individual button counters
function renderPaginationNumbers(totalPages) {
  const prevBtn = document.getElementById("prev-page-btn");
  const nextBtn = document.getElementById("next-page-btn");
  const numsBox = document.getElementById("pag-pages-nums");

  if (!prevBtn || !nextBtn || !numsBox) return;

  // 1. Enable/Disable buttons
  if (currentPage === 1) prevBtn.classList.add("disabled");
  else prevBtn.classList.remove("disabled");

  if (currentPage === totalPages) nextBtn.classList.add("disabled");
  else nextBtn.classList.remove("disabled");

  // 2. Clear and append page buttons
  numsBox.innerHTML = "";
  for (let i = 1; i <= totalPages; i++) {
    const pBtn = document.createElement("button");
    pBtn.className = `pag-btn ${currentPage === i ? "active" : ""}`;
    pBtn.textContent = i.toString();
    
    pBtn.addEventListener("click", () => {
      currentPage = i;
      renderView();
    });

    numsBox.appendChild(pBtn);
  }
}
export {};
