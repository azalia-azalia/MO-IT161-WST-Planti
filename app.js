
(() => {
  const $ = id => document.getElementById(id);

  const usersKey = 'planti_users';
  const plantsKey = 'planti_plants';
  const sessionKey = 'planti_session';
  const activityKey = 'planti_activities';

  let user = null;
  let toastTimer;

  const read = (key, fallback) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  };

  const write = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
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
    read(plantsKey, []).filter(plant => plant.owner === email());

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

  function showApp() {
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
    render();
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

  function renderPlants() {
    if (!user) return;

    const query = $('search').value.trim().toLowerCase();
    const health = $('healthFilter').value;
    const type = $('typeFilter').value;

    const all = allPlants();

    const filteredPlants = all.filter(plant => {
      const searchableText = [
        plant.name,
        plant.species,
        plant.type,
        plant.notes
      ].join(' ').toLowerCase();

      const matchesSearch = searchableText.includes(query);

      const matchesHealth =
        health === 'all' || plant.health === health;

      const matchesType =
        type === 'all' || plant.type === type;

      return matchesSearch && matchesHealth && matchesType;
    });

    $('allPlants').innerHTML = filteredPlants
      .map(card)
      .join('');

    $('allPlants').hidden = filteredPlants.length === 0;
    $('plantsEmpty').hidden = filteredPlants.length > 0;

    $('count').textContent =
      `${filteredPlants.length} ${
        filteredPlants.length === 1 ? 'plant' : 'plants'
      }${filteredPlants.length !== all.length ? ' found' : ''}`;
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

  function savePlant(event) {
    event.preventDefault();

    const name = $('plantName').value.trim();

    if (!name) {
      toast('Please give your plant a name.', true);
      return;
    }

    const plants = allPlants();
    const id = $('plantId').value;

    const existingPlant = plants.find(plant => plant.id === id);

    const plant = {
      id: id || uid(),
      owner: email(),
      name,
      type: $('plantType').value,
      species: $('plantSpecies').value.trim(),
      health: $('plantHealth').value,
      sunlight: $('plantSunlight').value,
      lastWatered: $('plantWatered').value,
      notes: $('plantNotes').value.trim(),

      createdAt:
        existingPlant?.createdAt || new Date().toISOString(),

      updatedAt: new Date().toISOString()
    };

    const updatedPlants = existingPlant
      ? plants.map(item => item.id === id ? plant : item)
      : [plant, ...plants];

    savePlants(updatedPlants);

    note(
      existingPlant
        ? `Updated ${plant.name}'s plant profile.`
        : `Added ${plant.name} to your garden.`,
      existingPlant ? '✎' : '✿'
    );

    closeForm();
    render();

    toast(
      existingPlant
        ? 'Plant details updated.'
        : 'A new leafy friend was added!'
    );
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

  function action(button) {
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
        savePlants(
          allPlants().filter(item => item.id !== id)
        );

        note(`Removed ${plant.name} from your garden.`, '−');

        closeDetails();
        render();
        toast(`${plant.name} was removed.`);
      }

      return;
    }

    if (actionName === 'water') {
      const plants = allPlants();
      const plant = plants.find(item => item.id === id);

      if (plant) {
        plant.lastWatered = new Date()
          .toISOString()
          .slice(0, 10);

        plant.health = 'Healthy';
        plant.updatedAt = new Date().toISOString();

        savePlants(plants);

        note(
          `Watered ${plant.name} and marked it healthy.`,
          '☼'
        );

        closeDetails();
        render();
        details(id);

        toast(`${plant.name} marked as watered.`);
      }
    }
  }

  // CONNECT THE BUTTONS AND FORMS

  $('loginTab').onclick = () => authMode('login');
  $('signupTab').onclick = () => authMode('signup');
  $('goSignup').onclick = () => authMode('signup');
  $('goLogin').onclick = () => authMode('login');

  // LOG IN

  $('loginForm').onsubmit = event => {
    event.preventDefault();

    const enteredEmail = $('loginEmail')
      .value.trim().toLowerCase();

    const enteredPassword = $('loginPassword').value;

    const account = read(usersKey, []).find(item =>
      item.email === enteredEmail &&
      item.password === enteredPassword
    );

    if (!account) {
      toast("That email and password don't match an account.", true);
      return;
    }

    user = account;

    write(sessionKey, {
      email: user.email
    });

    showApp();

    toast(`Welcome back, ${user.name.split(' ')[0]}!`);
  };

  // CREATE ACCOUNT

  $('signupForm').onsubmit = event => {
    event.preventDefault();

    const name = $('signupName').value.trim();

    const enteredEmail = $('signupEmail')
      .value.trim().toLowerCase();

    const password = $('signupPassword').value;

    const users = read(usersKey, []);

    if (name.length < 2) {
      toast('Please enter your name.', true);
      return;
    }

    if (users.some(item => item.email === enteredEmail)) {
      toast('An account with that email already exists.', true);
      return;
    }

    user = {
      id: uid(),
      name,
      email: enteredEmail,
      password,
      createdAt: new Date().toISOString()
    };

    users.push(user);

    write(usersKey, users);
    write(sessionKey, {
      email: enteredEmail
    });

    showApp();
    toast('Your little garden is ready!');
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
