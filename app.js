(() => {
  const $ = id => document.getElementById(id);

  const usersKey = 'planti_users';
  const plantsKey = 'planti_plants';
  const sessionKey = 'planti_session';
  const activityKey = 'planti_activities';

  let user = null;
  let toastTimer;
  let serverPlants = [];

  const read = (key, fallback) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  };

  const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Unable to save data:", error);
    toast(
      "Your changes could not be saved. Check your browser storage.",
      true
    );
    return false;
  }
};

  const uid = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  const esc = value =>
    String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);

  const email = () => user.email.toLowerCase();

  const allPlants = () =>
    serverPlants.filter(plant => plant.owner === email());

  async function loadPlants() {
    const response = await fetch('/api/plants');

    if (!response.ok) {
        throw new Error('Unable to retrieve plants.');
    }

    serverPlants = await response.json();
  }

  const savePlants = plants => {
    const otherUsersPlants = read(plantsKey, [])
      .filter(plant => plant.owner !== email());

    write(plantsKey, [...otherUsersPlants, ...plants]);
  };

  const activities = () =>
    read(activityKey, [])
      .filter(activity => activity.owner === email())
      .slice(0, 30);

  function note(text, icon = '✿') {
    const allActivities = read(activityKey, []);

    allActivities.unshift({
      id: uid(),
      owner: email(),
      text,
      icon,
      date: new Date().toISOString()
    });

    write(activityKey, allActivities.slice(0, 100));
  }

  function toast(message, error = false) {
    const element = $('toast');

    element.textContent = message;
    element.className = 'show' + (error ? ' error' : '');

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      element.className = '';
    }, 2700);
  }

  // SWITCH BETWEEN LOGIN AND SIGNUP

  function authMode(mode) {
    const isSignup = mode === 'signup';

    $('loginWrap').hidden = isSignup;
    $('signupWrap').hidden = !isSignup;

    $('loginTab').classList.toggle('active', !isSignup);
    $('signupTab').classList.toggle('active', isSignup);
  }

  function showAuth() {
    user = null;
    $('auth').hidden = false;
    $('app').hidden = true;

    authMode('login');
  }

  async function showApp() {
    $('auth').hidden = true;
    $('app').hidden = false;

    $('profileName').textContent = user.name;
    $('profileEmail').textContent = user.email;
    $('avatar').textContent = user.name.trim()[0].toUpperCase();

    $('dateChip').textContent = new Date().toLocaleDateString(
        undefined,
        {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        }
    );

    $('welcomeDate').textContent = new Date().toLocaleDateString(
        undefined,
        {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        }
    ).toUpperCase();

    navigate('dashboard');

    try {
        await loadPlants();
        render();
    } catch (error) {
        console.error(error);
        toast('Unable to load your plants. Please try again.', true);
    }
}

  // NAVIGATION

  function navigate(view) {
    const isPlants = view === 'plants';

    $('dashboard').hidden = isPlants;
    $('plants').hidden = !isPlants;

    $('crumbTitle').textContent = isPlants
      ? 'My plants'
      : 'Overview';

    document.querySelectorAll('.nav').forEach(button => {
      button.classList.toggle(
        'active',
        button.dataset.view === view
      );
    });

    if (isPlants) {
      renderPlants();
    }

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  // PLANT CARD HELPERS

  const emoji = {
    Indoor: '🪴',
    Outdoor: '🌳',
    Herb: '🌿',
    Flower: '🌷',
    Succulent: '🌵',
    Other: '🍃'
  };

  const palettes = [
    '',
    'art-1',
    'art-2',
    'art-3',
    'art-4',
    'art-5'
  ];

  function pill(health) {
    let className = '';

    if (health === 'Needs Water') {
      className = 'water';
    } else if (health === 'Needs Attention') {
      className = 'attention';
    }

    return `
      <span class="pill ${className}">
        ${esc(health)}
      </span>
    `;
  }

  function card(plant, index) {
    return `
      <article class="plant-card">
        <div class="plant-art ${palettes[index % palettes.length]}">
          <span class="type">
            ${esc(plant.type).toUpperCase()}
          </span>

          <span class="emoji">
            ${emoji[plant.type] || '🍃'}
          </span>
        </div>

        <div class="plant-body">
          <div class="plant-head">
            <div>
              <h3>${esc(plant.name)}</h3>
              <p class="species">
                ${esc(plant.species || plant.type || 'A leafy friend')}
              </p>
            </div>

            ${pill(plant.health)}
          </div>

          <div class="plant-meta">
            ☼ ${esc(plant.sunlight || 'Not set')}
          </div>

          <div class="card-actions">
            <button
              class="mini"
              data-action="details"
              data-id="${plant.id}"
              type="button"
            >
              View details
            </button>

            <button
              class="mini"
              data-action="edit"
              data-id="${plant.id}"
              type="button"
            >
              Edit
            </button>
          </div>
        </div>
      </article>
    `;
  }

  // UPDATE DASHBOARD AND CARE JOURNAL

  function render() {
    const plants = allPlants();

    $('total').textContent = plants.length;

    $('attention').textContent = plants.filter(
      plant => plant.health !== 'Healthy'
    ).length;

    $('healthy').textContent = plants.filter(
      plant => plant.health === 'Healthy'
    ).length;

    $('navCount').textContent = plants.length;

    const recentPlants = plants
      .slice()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 4);

    $('recentPlants').innerHTML = recentPlants
      .map(card)
      .join('');

    $('recentPlants').hidden = recentPlants.length === 0;
    $('dashEmpty').hidden = recentPlants.length > 0;

    const recentActivities = activities();

    $('activities').innerHTML = recentActivities
      .slice(0, 5)
      .map(activity => `
        <div class="activity">
          <b>${esc(activity.icon)}</b>

          <span>
            ${esc(activity.text)}

            <small>
              ${new Date(activity.date).toLocaleDateString(
                undefined,
                {
                  month: 'short',
                  day: 'numeric'
                }
              )}
            </small>
          </span>
        </div>
      `)
      .join('');

    $('activities').hidden = recentActivities.length === 0;
    $('activityEmpty').hidden = recentActivities.length > 0;

    renderPlants();
  }

  // SEARCH AND FILTER PLANTS

  async function renderPlants() {
    if (!user) return;

    const query = $('search').value.trim();
    const health = $('healthFilter').value;
    const type = $('typeFilter').value;

    // Prepare the search and filter parameters
    const params = new URLSearchParams();

    params.set('owner', email());

    if (query) {
      params.set('search', query);
    }

    if (health !== 'all') {
      params.set('health', health);
    }

    if (type !== 'all') {
      params.set('type', type);
    }

    try {
      // Send the search request to the backend
      const response = await fetch(
        `/api/plants?${params.toString()}`
      );

      const filteredPlants = await response.json();

      if (!response.ok) {
        throw new Error(
          filteredPlants.message || 'Unable to search plants.'
        );
      }

      // Display the matching plants
      $('allPlants').innerHTML = filteredPlants
        .map(card)
        .join('');

      $('allPlants').hidden = filteredPlants.length === 0;
      $('plantsEmpty').hidden = filteredPlants.length > 0;

      $('count').textContent =
        `${filteredPlants.length} ${
          filteredPlants.length === 1 ? 'plant' : 'plants'
        }${query || health !== 'all' || type !== 'all' ? ' found' : ''}`;

    } catch (error) {
      console.error(error);
      toast(error.message || 'Unable to filter plants.', true);
    }
  }

  // OPEN THE ADD OR EDIT FORM

  function openForm(plant = null) {
    $('plantForm').reset();

    $('plantId').value = plant?.id || '';

    $('modalTitle').textContent = plant
      ? 'Edit plant'
      : 'Add a plant';

    $('plantName').value = plant?.name || '';
    $('plantType').value = plant?.type || 'Indoor';
    $('plantSpecies').value = plant?.species || '';
    $('plantHealth').value = plant?.health || 'Healthy';
    $('plantSunlight').value = plant?.sunlight || 'Indirect light';
    $('plantWatered').value = plant?.lastWatered || '';
    $('plantNotes').value = plant?.notes || '';

    $('plantModal').hidden = false;
    document.body.style.overflow = 'hidden';

    setTimeout(() => $('plantName').focus(), 40);
  }

  function closeForm() {
    $('plantModal').hidden = true;
    document.body.style.overflow = '';
  }

  // SAVE A NEW PLANT OR UPDATE AN EXISTING ONE

  async function savePlant(event) {
    event.preventDefault();

    const name = $('plantName').value.trim();

    if (!name) {
        toast('Please give your plant a name.', true);
        return;
    }

    const id = $('plantId').value;
    const existingPlant = allPlants().find(plant => plant.id === id);

    const plant = {
        owner: email(),
        name,
        type: $('plantType').value,
        species: $('plantSpecies').value.trim(),
        health: $('plantHealth').value,
        sunlight: $('plantSunlight').value,
        lastWatered: $('plantWatered').value,
        notes: $('plantNotes').value.trim(),
        createdAt: existingPlant?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    // ADD A NEW PLANT THROUGH THE BACKEND
    if (!existingPlant) {
        try {
            const response = await fetch('/api/plants', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(plant)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Unable to add plant.');
            }

            serverPlants.unshift(result.plant);

            note(`Added ${plant.name} to your garden.`, '✿');

            closeForm();
            render();

            toast('A new leafy friend was added!');

        } catch (error) {
            console.error(error);
            toast(error.message || 'Unable to save your plant.', true);
        }

        return;
    }

    // UPDATE AN EXISTING PLANT THROUGH THE BACKEND
    try {
        const response = await fetch(`/api/plants/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(plant)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Unable to update plant.');
        }

        serverPlants = serverPlants.map(item =>
            item.id === id ? result.plant : item
        );

        note(`Updated ${plant.name}'s plant profile.`, '✎');

        closeForm();
        render();

        toast('Plant details updated.');

    } catch (error) {
        console.error(error);
        toast(error.message || 'Unable to update your plant.', true);
    }
  }
  // VIEW PLANT DETAILS

  function details(id) {
    const plants = allPlants();
    const plant = plants.find(item => item.id === id);

    if (!plant) return;

    const plantIndex = plants.findIndex(item => item.id === id);
    const plantEmoji = emoji[plant.type] || '🍃';
    const palette = palettes[plantIndex % palettes.length];

    $('detailContent').innerHTML = `
      <div class="detail-hero ${palette}">
        ${plantEmoji}

        <span class="detail-type">
          ${esc(plant.type).toUpperCase()} · YOUR GARDEN
        </span>
      </div>

      <div class="detail-body">
        <div class="detail-title">
          <div>
            <h2>${esc(plant.name)}</h2>
            <p>${esc(plant.species || 'Species not specified')}</p>
          </div>

          ${pill(plant.health)}
        </div>

        <div class="facts">
          <div class="fact">
            <small>PLANT TYPE</small>
            <b>${esc(plant.type)}</b>
          </div>

          <div class="fact">
            <small>SUNLIGHT</small>
            <b>${esc(plant.sunlight)}</b>
          </div>

          <div class="fact">
            <small>LAST WATERED</small>
            <b>
              ${
                plant.lastWatered
                  ? esc(
                      new Date(
                        plant.lastWatered + 'T12:00:00'
                      ).toLocaleDateString()
                    )
                  : 'Not recorded'
              }
            </b>
          </div>

          <div class="fact">
            <small>LAST UPDATED</small>
            <b>${new Date(plant.updatedAt).toLocaleDateString()}</b>
          </div>
        </div>

        <small>CARE NOTES</small>

        <div class="notes">
          ${esc(
            plant.notes ||
            'No notes yet. Add a little reminder for your future self.'
          )}
        </div>

        <div class="detail-actions">
          <button
            class="primary"
            data-action="water"
            data-id="${plant.id}"
            type="button"
          >
            ☼ Mark watered
          </button>

          <button
            class="secondary"
            data-action="edit"
            data-id="${plant.id}"
            type="button"
          >
            Edit details
          </button>

          <button
            class="secondary"
            data-action="delete"
            data-id="${plant.id}"
            type="button"
          >
            Delete
          </button>
        </div>
      </div>
    `;

    $('detailModal').hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeDetails() {
    $('detailModal').hidden = true;
    document.body.style.overflow = '';
  }

  // HANDLE PLANT ACTIONS

  async function action(button) {
    const { action: actionName, id } = button.dataset;

    if (actionName === 'details') {
      details(id);
      return;
    }

    if (actionName === 'edit') {
      const plant = allPlants().find(item => item.id === id);

      closeDetails();

      if (plant) {
        openForm(plant);
      }

      return;
    }

    if (actionName === 'delete') {
    const plant = allPlants().find(item => item.id === id);

    if (
        plant &&
        confirm(
            `Delete ${plant.name} from your garden? This cannot be undone.`
        )
    ) {
        try {
            const response = await fetch(`/api/plants/${id}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Unable to delete plant.');
            }

            serverPlants = serverPlants.filter(
                item => item.id !== id
            );

            note(`Removed ${plant.name} from your garden.`, '−');

            closeDetails();
            render();

            toast(`${plant.name} was removed.`);

        } catch (error) {
            console.error(error);
            toast(error.message || 'Unable to delete your plant.', true);
        }
    }

    return;
  }

    if (actionName === 'water') {
    const plant = allPlants().find(item => item.id === id);

    if (plant) {
        const updatedPlant = {
            ...plant,
            health: 'Healthy',
            lastWatered: [
                new Date().getFullYear(),
                String(new Date().getMonth() + 1).padStart(2, '0'),
                String(new Date().getDate()).padStart(2, '0')
            ].join('-'),
        };

        try {
            const response = await fetch(`/api/plants/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedPlant)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Unable to update plant.');
            }

            serverPlants = serverPlants.map(item =>
                item.id === id ? result.plant : item
            );

            note(
                `Watered ${plant.name} and marked it healthy.`,
                '☼'
            );

            closeDetails();
            render();
            details(id);

            toast(`${plant.name} marked as watered.`);

          } catch (error) {
              console.error(error);
              toast(error.message || 'Unable to mark plant as watered.', true);
          }
      }

      return;
    }
  }

  // CONNECT THE BUTTONS AND FORMS

  $('loginTab').onclick = () => authMode('login');
  $('signupTab').onclick = () => authMode('signup');
  $('goSignup').onclick = () => authMode('signup');
  $('goLogin').onclick = () => authMode('login');

  // LOG IN

  $('loginForm').onsubmit = async event => {
      event.preventDefault();

      const enteredEmail = $('loginEmail').value.trim().toLowerCase();
      const enteredPassword = $('loginPassword').value;

      try {
          const response = await fetch('/api/login', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  email: enteredEmail,
                  password: enteredPassword
              })
          });

          const result = await response.json();

          if (!response.ok) {
              throw new Error(result.message || 'Unable to log in.');
          }

          user = result.user;

          const users = read(usersKey, []).filter(
              item => item.email !== user.email
          );

          users.push(user);
          write(usersKey, users);

          write(sessionKey, {
              email: user.email
          });

          await showApp();

          toast(`Welcome back, ${user.name.split(' ')[0]}!`);

      } catch (error) {
          console.error(error);
          toast(error.message || 'Unable to log in.', true);
      }
  };

  // CREATE ACCOUNT

  $('signupForm').onsubmit = async event => {
      event.preventDefault();

      const name = $('signupName').value.trim();
      const enteredEmail = $('signupEmail').value.trim().toLowerCase();
      const password = $('signupPassword').value;

      if (name.length < 2) {
          toast('Please enter your name.', true);
          return;
      }

      try {
          const response = await fetch('/api/signup', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  name,
                  email: enteredEmail,
                  password
              })
          });

          const result = await response.json();

          if (!response.ok) {
              throw new Error(result.message || 'Unable to create account.');
          }

          user = result.user;

          const users = read(usersKey, []).filter(
              item => item.email !== user.email
          );

          users.push(user);
          write(usersKey, users);

          write(sessionKey, {
              email: user.email
          });

          await showApp();

          toast('Your little garden is ready!');

      } catch (error) {
          console.error(error);
          toast(error.message || 'Unable to create account.', true);
      }
  };
  
  // LOG OUT

  $('logout').onclick = () => {
    localStorage.removeItem(sessionKey);

    showAuth();
    toast('You have logged out.');
  };

  // ADD PLANT BUTTONS

  document.querySelectorAll('.add').forEach(button => {
    button.onclick = () => openForm();
  });

  $('quickAdd').onclick = () => openForm();

  // MODAL BUTTONS

  $('closeModal').onclick = closeForm;
  $('cancelModal').onclick = closeForm;

  $('plantModal').onclick = event => {
    if (event.target === $('plantModal')) {
      closeForm();
    }
  };

  $('plantForm').onsubmit = savePlant;

  $('closeDetail').onclick = closeDetails;

  $('detailModal').onclick = event => {
    if (event.target === $('detailModal')) {
      closeDetails();
    }
  };

  // SEARCH AND FILTER EVENTS

  $('search').oninput = renderPlants;
  $('healthFilter').onchange = renderPlants;
  $('typeFilter').onchange = renderPlants;

  // HANDLE PLANT BUTTONS AND NAVIGATION

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');

    if (button) {
      action(button);
      return;
    }

    const navigation = event.target.closest('[data-view]');

    if (navigation) {
      navigate(navigation.dataset.view);
    }
  });

  $('homeLink').onclick = event => {
    event.preventDefault();
    navigate('dashboard');
  };

  // ESCAPE KEY CLOSES MODALS

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeForm();
      closeDetails();
    }
  });

  // RESTORE THE PREVIOUS SESSION

  const session = read(sessionKey, null);

  if (session) {
    user = read(usersKey, []).find(
      account => account.email === session.email
    );

    if (user) {
      showApp();
    } else {
      showAuth();
    }
  } else {
    showAuth();
  }
})();
